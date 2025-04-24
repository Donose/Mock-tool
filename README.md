# Mock Tool

A local mock-server and web UI for creating, editing, deleting and persisting HTTP mocks.

## Features

- CRUD API for mock rules (`GET` `/__mocks`, `POST` `/__mocks`, `PUT` `/__mocks/:id`, `DELETE` `/__mocks/:id`)
- Disk persistence via `__mocks.json`
- Catch-all handler for any defined endpoint
- Health check endpoint (`GET` `/__health`)
- React/Vite front-end for managing mocks in the browser
- Compatible with the “rereRoute: Redirect HTTP requests” Chrome extension

## Dependencies

cd mock-api-server
npm install

cd mock-manager
npm install

## Run backend mock server
cd mock-manager
npm run dev

## Run frontend mock manager
cd mock-manager
npm run dev

## Usage
Add a Mock: Fill in Method, Endpoint (e.g. /v3/users), optional Headers and Body, Status Code, then click “Add Mock.”

Edit a Mock: Click “Edit,” modify fields, then click “Update Mock.”

Delete a Mock: Click “Delete” next to the mock rule.

Reload the Page: Your mocks will be re-fetched from the server and re-loaded from disk.

## Browser interception
Create rules by needs
From: https://api.yourapp.com/tobemocked
To:   http://localhost:4000/mocked