/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import "./MockManager.css";
import "./utils/utils.ts";
import { generateTransactionTime } from "./utils/utils.ts";
import { PLATFORM_TEMPLATES } from "./Template.ts";
import { Mock } from "./types.ts";

const MockManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<"online" | "offline" | "checking">("checking");
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [importMessage, setImportantMessage] = useState<string | null>(null);

  const initialFormData = {
    method: "GET",
    endpoint: "",
    status: 200,
    headers: '{ "Content-Type": "application/json" }',
    body: "{}",
  };

  const checkServerStatus = async () => {
    setServerStatus("checking");
    try {
      const res = await fetch("http://localhost:4000/__health");
      if (res.ok) {
        setServerStatus("online");
      } else {
        setServerStatus("offline");
      }
    } catch {
      setServerStatus("offline");
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(() => {
      checkServerStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (importMessage) {
      const timer = setTimeout(() => setImportantMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [importMessage]);

  useEffect(() => {
    const loadMocks = async () => {
      try {
        const res = await fetch("http://localhost:4000/__mocks");
        if (!res.ok) throw new Error("Failed to load mocks");
        const data: Mock[] = await res.json();
        setMocks(data);
      } catch (err) {
        console.error("Error fetching mocks:", err);
        alert("Could not load mocks from server—are you online?");
      }
    };

    loadMocks();
  }, []);

  const formatJsonField = (
    value: string,
    update: (formatted: string) => void,
    onError?: (message: string) => void
  ) => {
    const trimmed = value.trim();

    if (trimmed === "") return;
    try {
      const parsed = JSON.parse(value);
      const pretty = JSON.stringify(parsed, null, 2);
      update(pretty);
    } catch (err) {
      console.error("Error formatting JSON:", err);
      if (onError) {
        onError("Invalid JSON");
      }
    }
  };

  const toggleMockActive = async (id: string, currentlyActive: boolean) => {
    await fetch(`http://localhost:4000/__mocks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !currentlyActive }),
    });
    setMocks((prev) => prev.map((m) => (m.id === id ? { ...m, active: !currentlyActive } : m)));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [formData, setFormData] = useState(initialFormData);

  const [mocks, setMocks] = useState<Mock[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.endpoint.trim()) return;
    let parseHeaders;
    try {
      parseHeaders = formData.headers.trim() ? JSON.parse(formData.headers) : undefined;
    } catch {
      alert("Headers must be a valid JSON.");
      return;
    }
    let parseBody: any;
    try {
      parseBody = formData.body.trim() ? JSON.parse(formData.body) : undefined;
    } catch {
      parseBody = formData.body.trim();
    }
    if (includeTimestamp) {
      if (typeof parseBody === "object" && parseBody !== null) {
        parseBody.transactionTime = generateTransactionTime();
      } else if (typeof parseBody === "string" && parseBody.trim() === "") {
        parseBody = { transactionTime: generateTransactionTime() };
      } else if (
        typeof parseBody === "string" ||
        typeof parseBody === "number" ||
        typeof parseBody === "boolean"
      ) {
        parseBody = { value: parseBody, transactionTime: generateTransactionTime() };
      } else {
        parseBody = { transactionTime: generateTransactionTime() };
      }
    }
    if (editingId) {
      try {
        const response = await fetch(`http://localhost:4000/__mocks/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: formData.method,
            endpoint: formData.endpoint,
            status: formData.status,
            headers: parseHeaders,
            body: parseBody,
          }),
        });
        if (!response.ok) throw new Error("Failed to update mock");
        const updatedMock: Mock = await response.json();
        setMocks(mocks.map((m) => (m.id === editingId ? updatedMock : m)));
        setEditingId(null);
        setFormData(initialFormData);
      } catch (err) {
        console.error("Error updating mock:", err);
        alert("Could not update mock—make sure the server is running");
      }
      return;
    } else {
      const newMock: Mock = {
        id: crypto.randomUUID(),
        method: formData.method,
        endpoint: formData.endpoint,
        status: formData.status,
        headers: parseHeaders,
        body: parseBody,
        active: true,
      };
      try {
        const response = await fetch("http://localhost:4000/__mocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMock),
        });
        if (!response.ok) throw new Error("Failed to add mock");
        const createdMock: Mock = await response.json();
        setMocks([...mocks, createdMock]);
        setFormData(initialFormData);
      } catch (err) {
        console.error("Error adding mock:", err);
        alert("Failed to add mock. Make sure the server is running.");
      }
    }
  };

  const deleteMock = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/__mocks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setMocks(mocks.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Error deleting mock:", err);
      alert("Could not delete mock—make sure the server is running");
    }
  };
  const deleteAllMocks = async () => {
    if (!window.confirm("Are you sure you want to delete all mocks?")) return;
    for (const mock of mocks) {
      try {
        await fetch(`http://localhost:4000/__mocks/${mock.id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Error deleting mock:", err);
      }
    }
    setMocks([]);
  };
  const importTemplateMocks = async (platform: string) => {
    const templateMocks = PLATFORM_TEMPLATES[platform];
    if (!templateMocks) return;
    for (const mock of templateMocks) {
      try {
        const response = await fetch("http://localhost:4000/__mocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mock),
        });
        if (!response.ok) throw new Error("Failed to add mock");
        const createdMock: Mock = await response.json();
        setMocks((prev) => [...prev, createdMock]);
      } catch (err) {
        console.error("Error adding mock:", err);
      }
    }
  };
  const handleClick = async (platform: string) => {
    await importTemplateMocks(platform);
    setImportantMessage(
      `Imported ${platform} template mocks! Please add &&token = x=somestring as parameter in the URL! Modify GET from external body with the country/age/email you need.`
    );
  };
  return (
    <div className="mock-manager">
      <div className="api-doc-link">
        <a
          href="https://apidoc.horizon.ubisoft.org/standard-client-profiles?toolMeta=%257B%2522route%2522%253A%2522%2522%257D"
          target="_blank"
          rel="noopener noreferrer"
        >
          API Documentation
        </a>
      </div>
      <div className="server-status-container">
        <button onClick={checkServerStatus} className={`toggle-details-button ${serverStatus}`}>
          {serverStatus === "checking"
            ? "Checking Server..."
            : serverStatus === "online"
            ? "Server Online"
            : "Server Offline "}
        </button>
        {serverStatus === "offline" && (
          <div className="server-offline-message">
            <p>
              The mock server is not running.
              <br />
              Start it by running:
            </p>
            <pre className="server-offline-pre">npm run dev</pre>
            <p>
              Inside the <code>mock-api-server</code> folder
            </p>
          </div>
        )}
      </div>

      <h1>Mock API Manager</h1>
      <form className="mock-form" onSubmit={handleSubmit}>
        <h3>Add new Mock</h3>
        <div className="form-group-pair">
          <div className="form-label-column">Method:</div>
          <div className="form-input-column">
            <select
              id="method"
              name="method"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="OPTIONS">OPTIONS</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="form-group-pair">
            <div className="form-label-column">Endpoint Path:</div>
            <div className="form-input-column">
              <input
                type="text"
                id="endpoint"
                name="endpoint"
                placeholder="/v3/something"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                onBlur={(e) => setFormData({ ...formData, endpoint: e.target.value.trim() })}
              ></input>
            </div>
          </div>
          <div className="form-group-pair">
            <div className="form-label-column">Response Headers (JSON):</div>
            <div className="form-input-column">
              <textarea
                id="headers"
                name="headers"
                placeholder="Paste away, should be formatted automatically"
                value={formData.headers}
                onChange={handleInputChange}
                onBlur={() =>
                  formatJsonField(
                    formData.headers,
                    (formatted) => setFormData((prev) => ({ ...prev, headers: formatted })),
                    (message) => alert(message)
                  )
                }
                rows={4}
              />
            </div>
          </div>
          <div className="form-group-pair">
            <div className="form-label-column">Response Body (JSON or text)</div>
            <div className="form-input-column">
              <textarea
                id="body"
                name="body"
                placeholder="Paste away, should be formatted automatically"
                value={formData.body}
                onChange={handleInputChange}
                onBlur={() =>
                  formatJsonField(
                    formData.headers,
                    (formatted) => setFormData((prev) => ({ ...prev, headers: formatted })),
                    (message) => alert(message)
                  )
                }
                rows={4}
              />
            </div>
          </div>
          <div className="form-group-pair">
            <span className="form-label-column">Transaction Time</span>
            <div className="checkbox">
              <input
                type="checkbox"
                id="timestamp"
                checked={includeTimestamp}
                onChange={() => setIncludeTimestamp(!includeTimestamp)}
              />
            </div>
            <div className="form-label-column">Status Code:</div>
            <div className="form-input-column">
              <input
                type="number"
                id="status"
                min="100"
                max="599"
                placeholder="200"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button
            type="submit"
            onClick={(e) => {
              if (!formData.endpoint) {
                e.preventDefault();
                alert("Endpoint cannot be empty");
              }
            }}
          >
            {editingId ? "Update Mock" : "Add Mock"}
          </button>
          {editingId && (
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setEditingId(null);
                setFormData(initialFormData);
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
      <form>
        <h3> Third Party Token Mock</h3>
        <div className="mock-form">
          <button type="button" className="button-ps4" onClick={() => handleClick("PS4")}>
            PS4
          </button>
          <button type="button" className="button-ps5" onClick={() => handleClick("PS5")}>
            PS5
          </button>
          <button type="button" className="button-xbox" onClick={() => handleClick("XBX")}>
            XBX
          </button>
          <button type="button" className="button-xbox" onClick={() => handleClick("XB1")}>
            XB1
          </button>
          <button type="button" className="button-switch" onClick={() => handleClick("Switch")}>
            Switch
          </button>
          {importMessage && <div className="import-message">{importMessage}</div>}
        </div>
      </form>

      <h3>Active Mocks</h3>
      {mocks.length > 0 && (
        <button type="button" className="delete-all-button" onClick={deleteAllMocks}>
          Delete All Mocks
        </button>
      )}
      {mocks.length === 0 && <p className="no-mocks">No mocks defined yet</p>}
      <ul className="mock-list">
        {mocks.map((mock) => (
          <li key={mock.id} className="mock-item">
            <label className="switch">
              <input
                type="checkbox"
                checked={mock.active}
                onChange={() => toggleMockActive(mock.id, mock.active)}
              />
              <span className="slider">
                <span className="switch-label">{mock.active === true ? "ON" : "OFF"}</span>
              </span>
            </label>
            <div className="mock-details">
              <span className={`method-badge method-${mock.method}`}>{mock.method}</span>
              <span className="endpoint">{mock.endpoint}</span>
              <span className={`status-code status-${Math.floor(mock.status / 100)}xx`}>
                {mock.status}
              </span>
              <button
                className="toggle-details-button"
                onClick={() => setExpandedId(expandedId === mock.id ? null : mock.id)}
              >
                {expandedId === mock.id ? "Hide Details" : "Show Details"}
              </button>
              <button
                className="edit-button"
                onClick={() => {
                  setFormData({
                    method: mock.method,
                    endpoint: mock.endpoint,
                    status: mock.status,
                    headers: mock.headers ? JSON.stringify(mock.headers, null, 2) : "",
                    body:
                      typeof mock.body === "string"
                        ? mock.body
                        : mock.body
                        ? JSON.stringify(mock.body, null, 2)
                        : "",
                  });
                  setEditingId(mock.id);
                }}
              >
                Edit
              </button>
              <button className="delete-button" onClick={() => deleteMock(mock.id)}>
                Delete
              </button>
            </div>
            {expandedId === mock.id && (
              <>
                {mock.headers && (
                  <pre className="mock-headers">
                    Headers: {JSON.stringify(mock.headers, null, 2)}
                  </pre>
                )}
                {mock.body && (
                  <pre className="mock-body">
                    Body:{" "}
                    {typeof mock.body === "string" ? mock.body : JSON.stringify(mock.body, null, 2)}
                  </pre>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default MockManager;
