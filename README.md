# React + TypeScript + Vite – Mock Manager & Server Toolkit

This project provides a local mocking system for frontend and QA workflows.

It includes:

* A **React + Vite + TypeScript** UI (`mock-manager`) for creating and managing mocks
* An **Express-based mock API server** (`mock-server-api`) for serving responses
* A **Chrome extension** for live request redirection and health monitoring
* Support for per-mock delays, templates, connection status, and active mock sync

---

## 🔧 Features

### 🎨 Mock Manager UI

* Create, edit, and delete mock rules via a React-based UI
* Configure HTTP method, path, status code, headers, and response body
* Save, apply, and delete mock templates
* Toggle individual mocks on/off and set per-mock delays (ms)
* View real-time list of active mocks with search and filter capabilities

### 🧩 Mock Server (`mock-server-api`)

* Configure mock rules: method, path, status, headers, body
* Save templates
* Support for third-party token mocks
* Supports **per-mock delay** in milliseconds
* Match by method + path (with optional query parameters)
* Toggle mocks on/off from UI
* Auto-persistence to `__mocks.json`
* Manage templates (save, apply, delete)
* Exposes `/__active_mocks` for Chrome extension sync
* Health check: `GET /__health`

### 🧪 Chrome Extension

* Polls `https://localhost:4000/__active_mocks` and `https://localhost:4000/__health` every 6 seconds
* Uses `declarativeNetRequest` to update redirect rules based on active mocks
* Auto-applies changes when mock state updates
* Popup shows:

  * ✅ Connection status
  * 🔢 Active mock count
* No extension ID needed; no reloads required

---

## ⚙️ How to Run

### 1. Start the UI (Mock Manager)

```bash
cd mock-manager
npm install
npm run dev
```

### 2. Start the Mock Server (API)

#### HTTP mode

```bash
cd mock-server-api
npm install
npm run dev
```

#### HTTPS mode (after mkcert setup)

```bash
npm run mock:https
```

### 3. Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in top right).
3. Click **Load unpacked** and select the extension folder (where `manifest.json` lives).
4. Ensure the extension appears, and the popup opens.
5. The extension will poll active mocks and health status every 6 seconds.

### 4. (Optional) Serve Mock Server over HTTPS with mkcert

> **Note:** Only required if you want to use the included Chrome extension. Skip if using another HTTP-based redirect tool.

1. **Install mkcert**

   * macOS (Homebrew): `brew install mkcert` and `brew install nss`
   * Windows (Chocolatey): `choco install mkcert`
   * Linux: follow instructions at [https://github.com/FiloSottile/mkcert#installation](https://github.com/FiloSottile/mkcert#installation)
   * Choco install might be blocked by IT so use the mkcert github link and download it manually

2. **Create and trust a local CA**

```bash
mkcert -install
```

3. **Generate certificates for localhost**

```bash
mkcert -key-file ./certs/localhost-key.pem \
       -cert-file ./certs/localhost.pem localhost 127.0.0.1 ::1
```

4. **Configure the Mock Server**

```js
import https from 'https';
import fs from 'fs';
import app from './app';

const options = {
  key: fs.readFileSync('./certs/localhost-key.pem'),
  cert: fs.readFileSync('./certs/localhost.pem')
};

https.createServer(options, app).listen(4000, () => {
  console.log('Mock server running at https://localhost:4000');
});
```

5. **Start the Mock Server in HTTPS mode**

```bash
cd mock-server-api
npm run mock:https
```

6. **Reload the extension** to ensure it has permission for `https://localhost:4000/*`.

---

Feel free to list any other changes you need!
