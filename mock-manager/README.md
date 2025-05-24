React + TypeScript + Vite – Mock Manager & Server Toolkit
This project provides a local mocking system for frontend and QA workflows.

It includes:

A React + Vite + TypeScript UI for creating and managing mocks (mock-manager)

An Express-based mock API server (mock-server-api) that serves mock responses and templates

A Chrome extension for automatic request redirection using declarativeNetRequest

Features like per-mock delays, active mock syncing, and connection status display

🔧 Features
🧩 Mock Server (mock-server-api)
Configurable mock rules: method, path, status, headers, body

Match by method + path (with optional query param filtering)

Supports per-mock delay (in milliseconds)

Mock toggling (on/off)

Template management (save, apply, delete)

Auto-persistence to \_\_mocks.json

Healthcheck at /\_\_health

Exposes /\_\_active_mocks for Chrome extension sync

🧪 Chrome Extension (MV3)
Redirects live requests based on active mocks

Polls http://localhost:4000/\_\_active_mocks every second

Auto-syncs redirect rules via declarativeNetRequest

Displays:

✅ Connection status to the mock server

🔢 Active mock count

No extension ID config required

⚙️ How to Run
Step 1 – Start the Mock Server
bash
Copy
Edit
cd mock-server-api
npm install
npm run dev
Server runs on http://localhost:4000

Step 2 – Start the React UI
bash
Copy
Edit
cd mock-manager
npm install
npm run dev
UI runs on http://localhost:5173 (default Vite port)

Step 3 – Load the Chrome Extension
Open chrome://extensions

Enable Developer mode

Click "Load unpacked"

Select the extension folder containing:

manifest.json

background.js

popup.html

popup.js

🛠 Capabilities
Real-time mock editing and rule updates

Per-mock delay support

Chrome extension with polling + rule sync

Templates for reusing and sharing mock sets

Auto-removal of redirect rules when mocks are disabled

🧱 Stack
React + Vite (UI)

TypeScript

Express (mock server)

Chrome Extension (Manifest V3 + background worker)

📌 Future Improvements
✅ Hit counter per mock

⏳ Expirable or limited-use mocks

🔄 Templated dynamic responses

📜 Unmatched request logging

📊 Live request inspection

⬆️ Import/export mock sets

🧩 WebSocket / GraphQL support
