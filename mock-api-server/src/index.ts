import express, { Request, Response, RequestHandler } from "express";
import cors from "cors";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_FILE = path.join(__dirname, "__mocks.json");

type MockRule = {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  headers?: Record<string, string>;
  body?: any;
  transactionId?: string
  transactionTime?:string
  active:boolean
};

let mockRules: MockRule[] = [];


function matchRule(rule:MockRule, path:string, method:string){
 if (rule.method !==method) return false;
 
 const wildcard = rule.endpoint.indexOf("**");
 if (wildcard === -1) return rule.endpoint === path;

 const prefix = rule.endpoint.slice(0, wildcard);
 const suffix = rule.endpoint.slice(wildcard + 2);
 return path.startsWith(prefix) && path.endsWith(suffix);
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
  const rule = mockRules.find(r=> r.id === req.params.id);
  if (typeof req.body.active !== "boolean") {
    return res.status(400).send({ error: "active flag missing or invalid" });
  }

  rule.active = req.body.active;
  await saveMocks();
  res.json(rule);
})

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

app.get("/__health", (req, res) => {
  res.send({ status: "ok", timestamp: new Date().toISOString() });
});

const handleMockRequest: RequestHandler = (req, res) => {
  const matched = mockRules.find(r =>
    r.active &&                                
    matchRule(r, req.path, req.method)       
  );

  if (matched) {
    res.status(matched.status);
    if (matched.headers) {
      for (const [k, v] of Object.entries(matched.headers)) res.setHeader(k, v);
    }
    res.send(matched.body);
    console.log(`Mocked ${req.method} ${req.path} with status ${matched.status}`);
    return;
  }

  res.status(404).send({ error: "No mock matched" });
  console.log(`No mock matched for ${req.method} ${req.path}`);
};

app.all("*", handleMockRequest);

const startServer = async () => {
  await loadMocks();
  app.listen(PORT, () => {
    console.log(`Mock server running at http://localhost:${PORT}`);
  });
};

startServer();
