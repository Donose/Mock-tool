// mockServer.ts – complete drop‑in file
// ────────────────────────────────────────────────────────────
// A local HTTPS mock/proxy server for Ubisoft UbiServices APIs
// • Looks for trusted mkcert files in ./certs first
// • Falls back to `devcert` or an in‑memory self‑signed PEM pair
// • Persists mocks in __mocks.json and lets Chrome‑extension front‑end
//   read /__active_mocks every 6 seconds.
// ────────────────────────────────────────────────────────────

import express, { RequestHandler } from "express";
import cors from "cors";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import https from "https";
import fs, { existsSync, readFileSync } from "fs";
import selfsigned from "selfsigned";

// ------------------------------------------------------------
// Paths & helpers
// ------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT           = 4000;
const MOCK_FILE      = path.join(__dirname, "__mocks.json");
const REAL_API_URL   = "https://uat-public-ubiservices.ubi.com";
const TEMPLATES_DIR  = path.join(__dirname, "templates");
const CERTS_DIR      = path.join(__dirname, "certs");
const MKCERT_KEY     = path.join(CERTS_DIR, "localhost-key.pem");
const MKCERT_CERT    = path.join(CERTS_DIR, "localhost.pem");

[TEMPLATES_DIR, CERTS_DIR].forEach(dir =>
  fs.mkdirSync(dir, { recursive: true })
);

const sanitizeName = (name: string) =>
  name.replace(/[\\/:"*?<>|]+/g, "_").replace(/\s+/g, "_");

// ------------------------------------------------------------
// Types & in‑memory store
// ------------------------------------------------------------
interface MockRule {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  headers?: Record<string, string>;
  body?: any;
  transactionId?: string;
  transactionTime?: string;
  active: boolean;
  delay?: number;
  endpointUrl: string; 
}

let mockRules: MockRule[] = [];

// ------------------------------------------------------------
// Proxy to real API (only reached when no mock matches) //should remove|extension rules takes care of it
// ------------------------------------------------------------
const proxy = createProxyMiddleware({
  target: REAL_API_URL,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      // forward original headers (auth cookies, tokens …)
      Object.entries(req.headers).forEach(([k, v]) => {
        if (v) proxyReq.setHeader(k, v as string);
      });
    }
  }
});

// ------------------------------------------------------------
// Wild‑card / query‑aware matcher – supports "**" in the path
// ------------------------------------------------------------
function matchRule(
  rule: MockRule,
  pathname: string,
  method: string,
  query: any = {}
): boolean {
  if (!rule || typeof rule.method !== "string" || !rule.endpoint) return false;
  if (rule.method.toUpperCase() !== method.toUpperCase()) return false;

  const [rulePath, ruleQuery] = rule.endpoint.split("?");

  // "**" wildcard inside paths
  const wildcardIdx = rulePath.indexOf("**");
  const pathMatch = wildcardIdx === -1
    ? rulePath === pathname
    : pathname.startsWith(rulePath.slice(0, wildcardIdx)) &&
      pathname.endsWith(rulePath.slice(wildcardIdx + 2));

  if (!pathMatch) return false;

  if (ruleQuery) {
    const required = Object.fromEntries(new URLSearchParams(ruleQuery));
    for (const [k, v] of Object.entries(required)) {
      if (query[k] !== v) return false;
    }
    // Ignore any extra query params in the request (like locale)
    return true;
  }
  // If the mock has no query, match any query string
  return true;
}

// ------------------------------------------------------------
// Persistence helpers
// ------------------------------------------------------------
const loadMocks = async () => {
  try {
    mockRules = JSON.parse(await readFile(MOCK_FILE, "utf-8"));
    console.log(`Loaded ${mockRules.length} mocks from disk`);
  } catch {
    mockRules = [];
    console.log("No __mocks.json found – starting fresh");
  }
};

const saveMocks = async () => {
  await writeFile(MOCK_FILE, JSON.stringify(mockRules, null, 2), "utf-8");
  console.log("Saved mocks → __mocks.json");
};

// ------------------------------------------------------------
// Express app & endpoints
// ------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// -------- Templates CRUD --------
app.get("/__templates", (_, res) => {
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith(".json"));
  res.json(files.map(f => f.replace(".json", "")));
});

app.post("/__templates/save/:name", async (req, res) => {
  const safe = sanitizeName(req.params.name);
  await writeFile(path.join(TEMPLATES_DIR, `${safe}.json`), JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

app.post("/__templates/apply/:name", async (req, res) => {
  const safe = sanitizeName(req.params.name);
  const file = path.join(TEMPLATES_DIR, `${safe}.json`);
  if (!existsSync(file)) return res.status(404).json({ error: "Template not found" });
  const data = await readFile(file, "utf-8");
  mockRules = JSON.parse(data);
  await saveMocks();
  res.json({ success: true });
});

app.delete("/__templates/:name", (req, res) => {
  const safe = sanitizeName(req.params.name);
  const file = path.join(TEMPLATES_DIR, `${safe}.json`);
  if (!existsSync(file)) return res.status(404).json({ error: "Template not found" });
  fs.unlinkSync(file);
  res.json({ success: true });
});

// -------- Mocks CRUD --------
app.get("/__mocks", (_, res) => res.json(mockRules));

app.post("/__mocks", async (req, res) => {
  const incoming: MockRule = { ...req.body, active: true };
  mockRules.push(incoming);
  await saveMocks();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(201).json(incoming);
});

app.patch("/__mocks/:id", async (req, res) => {
  const rule = mockRules.find(r => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: "Mock not found" });
  if (typeof req.body.active === "boolean") rule.active = req.body.active;
  if (typeof req.body.delay  === "number")  rule.delay  = req.body.delay;
  await saveMocks();
  res.json(rule);
});

app.put("/__mocks/:id", async (req, res) => {
  const idx = mockRules.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Mock not found" });
  mockRules[idx] = { ...mockRules[idx], ...(req.body as Partial<MockRule>) };
  await saveMocks();
  res.json(mockRules[idx]);
});

app.delete("/__mocks/:id", async (req, res) => {
  mockRules = mockRules.filter(r => r.id !== req.params.id);
  await saveMocks();
  res.sendStatus(204);
});

// -------- List active mocks (for Chrome extension) --------
app.get("/__active_mocks", (_, res) => {
  res.json(
    mockRules
      .filter(
        m =>
          m.active &&
          typeof m.endpoint === "string" &&
          m.endpoint.startsWith("/") &&
          typeof m.method === "string" &&
          typeof m.endpointUrl === "string"
      )
      .map(m => ({ url: m.endpoint, method: m.method, endpointUrl: m.endpointUrl }))
  );
});

// -------- Health probe --------
app.get("/__health", (_, res) => res.send({ status: "ok", timestamp: new Date().toISOString() }));

// ------------------------------------------------------------
// Core handler – decide mock vs proxy
// ------------------------------------------------------------
const handleMock: RequestHandler = async (req, res, next) => {
  const found = mockRules.find(r => matchRule(r, req.path, req.method, req.query));
  const active = found && found.active ? found : undefined;
 const duplicates = mockRules.filter(
  r => r.endpoint === req.path && r.method === req.method
);
const activeDuplicates = duplicates.filter(r => r.active);
  
 if (duplicates.length > 1) {
  if (activeDuplicates.length > 1) {
    console.log(
      `⚠️  Multiple active mocks found for ${req.method} ${req.path}. Setting all but one to inactive.`
    );
    activeDuplicates.slice(1).forEach(dup => {
      dup.active = false;
    });
    await saveMocks();
  } else if (activeDuplicates.length === 1) {
  } else {
    console.log(
      `⚠️  Multiple mocks found for ${req.method} ${req.path}, but none are active.`
    );
  }
}

  if (active) {
    if (active.delay) await new Promise(r => setTimeout(r, active.delay));
    res.status(active.status);
    if (active.headers) Object.entries(active.headers).forEach(([k, v]) => res.setHeader(k, v));
    res.send(active.body);
    console.log(`▶︎ Mocked ${req.method} ${req.path} → ${active.status}`);
    return;
  }

  if (found && !found.active) {
    console.log(`▶︎ Mock for ${req.method} ${req.path} inactive → redirect to backend`);
  } else {
    console.log(`▶︎ No mock for ${req.method} ${req.path} → redirect to backend`);
  }

  next();
};

app.all("*", handleMock, proxy);

// ------------------------------------------------------------
// HTTPS bootstrap
// ------------------------------------------------------------
const startServer = async () => {
  await loadMocks();

  // 1) mkcert files in ./certs
  let ssl: { key: string | Buffer; cert: string | Buffer };
  if (existsSync(MKCERT_KEY) && existsSync(MKCERT_CERT)) {
    console.log("🔒 Using mkcert certs from ./certs");
    ssl = { key: readFileSync(MKCERT_KEY), cert: readFileSync(MKCERT_CERT) };
  } else {
    try {
      const { certificateFor } = await import("devcert");
      console.log("🔒 Using devcert for localhost");
      ssl = await certificateFor("localhost");
    } catch (err: any) {
      console.warn("⚠️  devcert unavailable - generating self-signed", err.message);
      const pems = selfsigned.generate(
        [{ name: "commonName", value: "localhost" }],
        { days: 365 }
      );
      ssl = { key: pems.private, cert: pems.cert };
    }
  }

  https.createServer(ssl, app).listen(PORT, () =>
    console.log(`🛡️  Mock server running at https://localhost:${PORT}`)
  );
};

startServer();