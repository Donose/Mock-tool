/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import "./MockManager.css";
import { generateTransactionTime } from "./utils/utils.ts";
import { PLATFORM_TEMPLATES } from "./Template.ts";
import { Mock } from "./types.ts";
import ServerCheck from "./components/ServerCheck.tsx";
import MockForm from "./components/MockForm";
import MockList from "./components/MockList";
import TemplatesPanel from "./components/TemplatesPanel";
import ThirdPartyImport from "./components/ThirdPartyImport";

const MockManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [thirdPartyMessage, setThirdPartyMessage] = useState<string | null>(null);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const [templates, setTemplates] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(true);
  const [formData, setFormData] = useState({
    method: "GET",
    endpoint: "",
    status: 200,
    headers: '{ "Content-Type": "application/json" }',
    body: "{}",
    delay: 0,
  });
  const [mocks, setMocks] = useState<Mock[]>([]);

  const fetchTemplates = async () => {
    const res = await fetch("http://localhost:4000/__templates");
    setTemplates(await res.json());
  };

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

  useEffect(() => {
    fetchTemplates();
    loadMocks();
  }, []);

  useEffect(() => {
    if (thirdPartyMessage) {
      const timer = setTimeout(() => setThirdPartyMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [thirdPartyMessage]);

  useEffect(() => {
    if (templateMessage) {
      const timer = setTimeout(() => setTemplateMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [templateMessage]);

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
      if (onError) onError("Invalid JSON");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.endpoint.trim()) return;

    let parseHeaders;
    try {
      parseHeaders = formData.headers.trim() ? JSON.parse(formData.headers) : undefined;
    } catch {
      alert("Headers must be valid JSON.");
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
      } else {
        parseBody = { value: parseBody, transactionTime: generateTransactionTime() };
      }
    }

    if (editingId) {
      try {
        const res = await fetch(`http://localhost:4000/__mocks/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: formData.method,
            endpoint: formData.endpoint,
            status: formData.status,
            headers: parseHeaders,
            body: parseBody,
            delay: formData.delay || 0,
          }),
        });
        setIncludeTimestamp(false);
        if (!res.ok) throw new Error("Failed to update mock");
        const updatedMock: Mock = await res.json();
        setMocks(mocks.map((m) => (m.id === editingId ? updatedMock : m)));
        setEditingId(null);
        setFormData({
          method: "GET",
          endpoint: "",
          status: 200,
          headers: '{ "Content-Type": "application/json" }',
          body: "{}",
          delay: 0,
        });
        setIncludeTimestamp(false);
      } catch (err) {
        console.error("Error updating mock:", err);
        alert("Could not update mock");
      }
      return;
    }

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
      const res = await fetch("http://localhost:4000/__mocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMock),
      });
      if (!res.ok) throw new Error("Failed to add mock");
      const createdMock: Mock = await res.json();
      setMocks([...mocks, createdMock]);
      setFormData({
        method: "GET",
        endpoint: "",
        status: 200,
        headers: '{ "Content-Type": "application/json" }',
        body: "{}",
        delay: 0,
      });
      setIncludeTimestamp(false);
    } catch (err) {
      console.error("Error adding mock:", err);
      alert("Failed to add mock");
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
      alert("Could not delete mock");
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
        const res = await fetch("http://localhost:4000/__mocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mock),
        });
        const createdMock: Mock = await res.json();
        setMocks((prev) => [...prev, createdMock]);
      } catch (err) {
        console.error("Error adding mock:", err);
      }
    }
  };

  const handleClick = async (platform: string) => {
    await importTemplateMocks(platform);
    setThirdPartyMessage(
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
      <ServerCheck />
      <h1>Mock API Manager</h1>

      <TemplatesPanel
        templates={templates}
        showTemplates={showTemplates}
        toggleShowTemplates={() => setShowTemplates((prev) => !prev)}
        onApply={async (tpl) => {
          await fetch(`http://localhost:4000/__templates/apply/${encodeURIComponent(tpl)}`, {
            method: "POST",
          });
          setTemplateMessage(`Template "${tpl}" applied!`);
          const res = await fetch("http://localhost:4000/__mocks");
          setMocks(await res.json());
        }}
        onDelete={async (tpl) => {
          await fetch(`http://localhost:4000/__templates/${encodeURIComponent(tpl)}`, {
            method: "DELETE",
          });
          setTemplates(templates.filter((t) => t !== tpl));
          setTemplateMessage(`Template "${tpl}" deleted!`);
        }}
        message={templateMessage}
      />

      <MockForm
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
        includeTimestamp={includeTimestamp}
        setIncludeTimestamp={setIncludeTimestamp}
        onSubmit={handleSubmit}
        onCancelEdit={() => {
          setEditingId(null);
          setFormData({
            method: "GET",
            endpoint: "",
            status: 200,
            headers: '{ "Content-Type": "application/json" }',
            body: "{}",
            delay: 0,
          });
          setIncludeTimestamp(false);
        }}
        formatJsonField={formatJsonField}
      />

      <ThirdPartyImport onImport={handleClick} importMessage={thirdPartyMessage} />

      <h3>Active Mocks</h3>
      {mocks.length > 0 && (
        <div>
          <button type="button" className="delete-all-button" onClick={deleteAllMocks}>
            Delete All Mocks
          </button>
          <button
            type="button"
            className="export-button"
            onClick={async () => {
              const name = prompt("Template name?");
              if (!name) return;
              await fetch(`http://localhost:4000/__templates/save/${encodeURIComponent(name)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mocks),
              });
              setTemplateMessage(`Template "${name}" saved!`);
              fetchTemplates();
            }}
          >
            Save as Template
          </button>
        </div>
      )}
      {mocks.length === 0 && <p className="no-mocks">No mocks defined yet</p>}

      <MockList
        mocks={mocks}
        expandedId={expandedId}
        setExpandedId={setExpandedId}
        toggleMockActive={toggleMockActive}
        onEdit={(mock) => {
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
            delay: mock.delay ?? 0,
          });
          setEditingId(mock.id);
        }}
        onDelete={deleteMock}
        onDelayChange={async (id: string, delay: number) => {
          try {
            const res = await fetch(`http://localhost:4000/__mocks/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ delay }),
            });
            if (!res.ok) throw new Error("Failed to update delay");
            setMocks((prev) => prev.map((m) => (m.id === id ? { ...m, delay } : m)));
          } catch (err) {
            console.error("Error updating delay:", err);
            alert("Could not update delay");
          }
        }}
      />
    </div>
  );
};

export default MockManager;
