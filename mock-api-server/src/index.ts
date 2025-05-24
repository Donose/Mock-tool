import express, { Request, Response, RequestHandler } from "express";
import cors from "cors";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {createProxyMiddleware} from 'http-proxy-middleware';
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_FILE = path.join(__dirname, "__mocks.json");
const REAL_API_URL = "https://uat-public-ubiservices.ubi.com";
const TEMPLATES_DIR = path.join(__dirname, "templates");
if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR);
const sanitizeName = (name: string) =>
name.replace(/[\\/:"*?<>|]+/g, "_").replace(/\s+/g, "_");


type MockRule = {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  headers?: Record<string, string>;
  body?: any;
  transactionId?: string
  transactionTime?:string
  active:boolean;
  delay?:number;
};

let mockRules: MockRule[] = [];

//rerouting to real call not going to happen :(
const proxy = createProxyMiddleware({
  target: REAL_API_URL,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value) proxyReq.setHeader(key, value as string);
      });

    }
  }
});

function matchRule(rule:MockRule, path:string, method:string, query: any ={}){
 if (rule.method !==method) return false;
 
 const [rulePath, ruleQueryString] = rule.endpoint.split("?");
  const wildcard = rulePath.indexOf("**");
  let pathMatch = false;
  if (wildcard === -1) {
    pathMatch = rulePath === path;
  } else {
    const prefix = rulePath.slice(0, wildcard);
    const suffix = rulePath.slice(wildcard + 2);
    pathMatch = path.startsWith(prefix) && path.endsWith(suffix);
  }

  if (!pathMatch) return false;

  if (ruleQueryString) {
    const ruleParams = Object.fromEntries(new URLSearchParams(ruleQueryString));
    for (const [k, v] of Object.entries(ruleParams)) {
      if (query[k] !== v) return false;
    }
  }

  return true;
}

const loadMocks = async () => {
  try{
      const data = await readFile(MOCK_FILE, "utf-8");
      mockRules = JSON.parse(data);
      console.log(`Loaded ${mockRules.length} mocks`);
  }
  catch{
    mockRules = [];
    console.log("No saved mocks found. Starting fresh.");
  }
};

const saveMocks = async () => {
  await writeFile(MOCK_FILE, JSON.stringify(mockRules, null, 2), "utf-8");
  console.log("Saved mocks to disk");
};

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/__templates", (req, res) => {
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith(".json"));
  res.json(files.map(f => f.replace(".json", "")));
});
app.post("/__templates/save/:name", async (req, res) => {
  const name = sanitizeName(req.params.name);
  const filePath = path.join(TEMPLATES_DIR, `${name}.json`);
  await writeFile(filePath, JSON.stringify(req.body, null, 2), "utf-8");
  res.json({ success: true });
});

app.post("/__templates/apply/:name", async (req, res) => {
  const name = sanitizeName(req.params.name);
  const filePath = path.join(TEMPLATES_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Template not found" });
  const data = await readFile(filePath, "utf-8");
  await writeFile(MOCK_FILE, data, "utf-8");
  mockRules = JSON.parse(data);
  res.json({ success: true });
});

app.delete("/__templates/:name", (req, res) => {
  const name = sanitizeName(req.params.name);
  const filePath = path.join(TEMPLATES_DIR, `${name}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Template not found" });
  }
});


app.get("/__mocks", (req: Request, res: Response) => {
  res.json(mockRules);
});

app.post("/__mocks", async (req: Request, res: Response) => {
  const newMock = {...req.body, active:true} as MockRule;
  mockRules.push(newMock);
  await saveMocks();
  res.status(201).json(newMock);
});

app.patch("/__mocks/:id", async (req: Request, res: Response) => {
  const rule = mockRules.find(r => r.id === req.params.id);
  if (!rule) {
    return res.status(404).send({ error: "Mock not found" });
  }

  if (typeof req.body.active === "boolean") {
    rule.active = req.body.active;
  }

  if (typeof req.body.delay === "number") {
    rule.delay = req.body.delay;
  }

  await saveMocks();
  res.json(rule);
});


app.delete("/__mocks/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  mockRules = mockRules.filter((mock) => mock.id !== id);
  await saveMocks();
  res.sendStatus(204);
});

app.put("/__mocks/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const idx = mockRules.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).send({ error: "Not found" });

  const updated = { ...mockRules[idx], ...req.body as Partial<MockRule> };
  mockRules[idx] = updated;

  await saveMocks();
  res.json(updated);
});

app.get("/__active_mocks", (req: Request, res: Response) => {
  const activeMocks = mockRules.filter(m => m.active);
  res.json(
    activeMocks.map((m, i) => ({
      url: m.endpoint,
      method: m.method
    }))
  );
});

app.get("/__health", (req, res) => {
  res.send({ status: "ok", timestamp: new Date().toISOString() });
});

const handleMockRequest: RequestHandler = async (req, res, next) => {
  const anyMock = mockRules.find(r =>
    matchRule(r, req.path, req.method, req.query)
  );
  const matched = anyMock && anyMock.active ? anyMock : undefined;

  if (matched) {
    if (matched.delay && typeof matched.delay === "number") {
      console.log(`Delaying response for ${matched.delay}ms`);
      await new Promise(resolve => setTimeout(resolve, matched.delay));
    }

    res.status(matched.status);
    if (matched.headers) {
      for (const [k, v] of Object.entries(matched.headers)) {
        res.setHeader(k, v);
      }
    }

    res.send(matched.body);
    console.log(`Mocked ${req.method} ${req.path} with status ${matched.status}`);
    return;
  }

  if (anyMock && !anyMock.active) {
    console.log(`Mock for ${req.method} ${req.path} is inactive, proxying to real API`);
    res.status(401).send({ error: "Mock is inactive" });
    return next();
  }

  console.log(`No mock matched for ${req.method} ${req.path}`);
  res.status(404).send({ error: "No mock matched" });
};


app.all("*", handleMockRequest, proxy);

const startServer = async () => {
  await loadMocks();
  app.listen(PORT, () => {
    console.log(`Mock server running at http://localhost:${PORT}`);
  });
};

startServer();
