/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";

interface Props {
  templateGroups: { [folder: string]: string[] };
  showTemplates: boolean;
  toggleShowTemplates: () => void;
  onApply: (tpl: string, folder: string) => void;
  onDelete: (tpl: string, folder: string) => void;
  message: string | null;
}

const TemplatesPanel: React.FC<Props> = ({
  templateGroups,
  showTemplates,
  toggleShowTemplates,
  onApply,
  onDelete,
  message,
}) => {
  const [openFolders, setOpenFolders] = useState<{ [folder: string]: boolean }>({});
  const [templateDetails, setTemplateDetails] = useState<{ [key: string]: any }>({});
  const [openDetails, setOpenDetails] = useState<{ [key: string]: boolean }>({});

  const fetchTemplateDetails = async (folder: string, tpl: string) => {
    const key = `${folder}/${tpl}`;
    if (!templateDetails[key]) {
      const res = await fetch(
        `https://localhost:4000/__templates/${folder ? folder + "/" : ""}${tpl}`
      );
      const data = await res.json();
      setTemplateDetails((prev) => ({ ...prev, [key]: data }));
    }
  };

  const toggleDetails = (folder: string, tpl: string) => {
    const key = `${folder}/${tpl}`;
    setOpenDetails((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleFolder = (folder: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  return (
    <div className="template-list">
      <div
        className="template-list-header"
        style={{ display: "flex", alignItems: "center", gap: "1rem" }}
      >
        <h3 style={{ margin: 0 }}>Templates</h3>
        {Object.keys(templateGroups).length > 0 && (
          <button type="button" className="toggle-button" onClick={toggleShowTemplates}>
            {showTemplates ? "Collapse All" : "Show All"}
          </button>
        )}
      </div>
      {message && <div className="import-message">{message}</div>}
      {showTemplates && (
        <>
          {Object.entries(templateGroups).map(([folder, templates]) => (
            <div key={folder || "root"} className="template-folder">
              <div
                style={{
                  fontWeight: "bold",
                  marginTop: "1em",
                  cursor: "pointer",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => toggleFolder(folder)}
              >
                <span style={{ marginRight: 8 }}>{openFolders[folder] ? "▼" : "▶"}</span>
                {folder || "Root"}
              </div>
              {openFolders[folder] &&
                templates.map((tpl) => {
                  const key = `${folder}/${tpl}`;
                  return (
                    <div key={tpl} className="template-item">
                      <span className="template-name">{tpl}</span>
                      <button type="button" onClick={() => onApply(tpl, folder)}>
                        Apply Template
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        style={{ marginLeft: "0.5rem", background: "#c00" }}
                        onClick={() => {
                          if (!window.confirm(`Delete template "${tpl}"?`)) return;
                          onDelete(tpl, folder);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="details-button"
                        style={{ marginLeft: "0.5rem" }}
                        onClick={async () => {
                          toggleDetails(folder, tpl);
                          await fetchTemplateDetails(folder, tpl);
                        }}
                      >
                        {openDetails[key] ? "Hide Details" : "Show Details"}
                      </button>
                      {openDetails[key] && templateDetails[key] && (
                        <pre
                          style={{
                            background: "#80808080",
                            padding: "0.5em",
                            marginTop: "0.5em",
                            borderRadius: 4,
                            fontSize: "0.95em",
                            overflowX: "auto",
                          }}
                        >
                          {JSON.stringify(templateDetails[key], null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default TemplatesPanel;
