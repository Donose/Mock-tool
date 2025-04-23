/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import "./MockManager.css";

interface Mock {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  headers?: Record<string, string>;
  body?: any;
}

const MockManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<"online" | "offline" | "checking">("checking");

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
  // inside MockManager, right after your useState hooks:

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
      } catch (e) {
        console.error("Error updating mock:", e);
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
    } catch (e) {
      console.error("Error deleting mock:", e);
      alert("Could not delete mock—make sure the server is running");
    }
  };
  return (
    <div className="mock-manager">
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <button
          onClick={checkServerStatus}
          className="toggle-details-button"
          style={{ backgroundColor: serverStatus === "online" ? "#00c776" : "#555" }}
        >
          {serverStatus === "checking"
            ? "Checking Server..."
            : serverStatus === "online"
            ? "Server Online"
            : "Server Offline "}
        </button>
        {serverStatus === "offline" && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#ff8080" }}>
            <p>
              The mock server is not running.
              <br />
              Start it by running:
            </p>
            <pre
              style={{
                backgroundColor: "#1e1e1e",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                display: "inline-block",
              }}
            >
              npm run dev
            </pre>
            <p>
              Inside the <code>mock-manager</code> folder
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
                onChange={(e) =>
                  setFormData({ ...formData, endpoint: e.target.value.toLowerCase() })
                }
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
                value={formData.headers}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>

          <div className="form-group-pair">
            <div className="form-label-column">Response Body (JSON or text)</div>
            <div className="form-input-column">
              <textarea
                id="body"
                name="body"
                placeholder='e.g. {\"token\": \"userData\"} or plain text'
                value={formData.body}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>
          <div className="form-group-pair">
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
          <button type="button" className="import-button" onClick={() => alert("NOT IMPLEMENTED")}>
            Import Mock Placeholder
          </button>
          <button type="submit">{editingId ? "Update Mock" : "Add Mock"}</button>

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

      <h3>Active Mocks</h3>
      {mocks.length === 0 && <p>No mocks defined yet</p>}
      <ul className="mock-list">
        {mocks.map((mock) => (
          <li key={mock.id} className="mock-item">
            <div className="mock-details">
              <span className={`method-badge method-${mock.method.toLowerCase()}`}>
                {mock.method}
              </span>
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
              <button
                type="button"
                className="export-button"
                onClick={() => alert("NOT IMPLEMENTED")}
              >
                Export Placeholder
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
