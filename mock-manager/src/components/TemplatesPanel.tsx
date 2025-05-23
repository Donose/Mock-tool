import React from "react";

interface Props {
  templates: string[];
  showTemplates: boolean;
  toggleShowTemplates: () => void;
  onApply: (tpl: string) => void;
  onDelete: (tpl: string) => void;
  message: string | null;
}

const TemplatesPanel: React.FC<Props> = ({
  templates,
  showTemplates,
  toggleShowTemplates,
  onApply,
  onDelete,
  message,
}) => {
  return (
    <div className="template-list">
      <div
        className="template-list-header"
        style={{ display: "flex", alignItems: "center", gap: "1rem" }}
      >
        <h3 style={{ margin: 0 }}>Templates</h3>
        <button type="button" className="toggle-button" onClick={toggleShowTemplates}>
          {showTemplates ? "Collapse All" : "Show All"}
        </button>
      </div>
      {message && <div className="import-message">{message}</div>}
      {showTemplates && (
        <>
          {templates.map((tpl) => (
            <div key={tpl} className="template-item">
              <span className="template-name">{tpl}</span>
              <button type="button" onClick={() => onApply(tpl)}>
                Apply Template
              </button>
              <button
                type="button"
                className="delete-button"
                style={{ marginLeft: "0.5rem", background: "#c00" }}
                onClick={() => {
                  if (!window.confirm(`Delete template "${tpl}"?`)) return;
                  onDelete(tpl);
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default TemplatesPanel;
