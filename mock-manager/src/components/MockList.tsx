import React from "react";
import { Mock } from "../types";

interface Props {
  mocks: Mock[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  toggleMockActive: (id: string, active: boolean) => void;
  onEdit: (mock: Mock) => void;
  onDelete: (id: string) => void;
}

const MockList: React.FC<Props> = ({
  mocks,
  expandedId,
  setExpandedId,
  toggleMockActive,
  onEdit,
  onDelete,
}) => {
  return (
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
              <span className="switch-label">{mock.active ? "ON" : "OFF"}</span>
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
            <button className="edit-button" onClick={() => onEdit(mock)}>
              Edit
            </button>
            <button className="delete-button" onClick={() => onDelete(mock.id)}>
              Delete
            </button>
          </div>
          {expandedId === mock.id && (
            <>
              {mock.headers && (
                <pre className="mock-headers">Headers: {JSON.stringify(mock.headers, null, 2)}</pre>
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
  );
};

export default MockList;
