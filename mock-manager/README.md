# React + TypeScript + Vite – Mock Manager & Server Toolkit

This project provides a local mocking system for frontend and QA workflows.

It includes:

- A **React + Vite + TypeScript** UI (`mock-manager`) for creating and managing mocks
- An **Express-based mock API server** (`mock-server-api`) for serving responses
- A **Chrome extension** for live request redirection
- Support for per-mock delays, templates, connection status, and active mock sync

---

## 🔧 Features

### 🧩 Mock Server (`mock-server-api`)

- Configure mock rules: method, path, status, headers, body
- Supports **per-mock delay** in milliseconds
- Match by method + path (with optional query parameters)
- Toggle mocks on/off from UI
- Auto-persistence to `__mocks.json`
- Manage templates (save, apply, delete)
- Exposes `/__active_mocks` for Chrome extension sync
- Health check: `GET /__health`

### 🧪 Chrome Extension

- Polls `http://localhost:4000/__active_mocks` every 1 second
- Uses `declarativeNetRequest` to update redirect rules
- Auto-applies changes when mock state updates
- Popup shows:
  - ✅ Connection status
  - 🔢 Active mock count
- No extension ID needed; no reloads required

---

## ⚙️ How to Run

### 1. Start the Mock Server

```bash
cd mock-server-api
npm install
npm run dev
```
