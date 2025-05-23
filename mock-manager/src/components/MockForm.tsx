/* eslint-disable @typescript-eslint/no-explicit-any */
// components/MockForm.tsx
import React from "react";
import "../MockManager.css";

type Props = {
  formData: {
    method: string;
    endpoint: string;
    status: number;
    headers: string;
    body: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  editingId: string | null;
  includeTimestamp: boolean;
  setIncludeTimestamp: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  formatJsonField: (
    value: string,
    update: (formatted: string) => void,
    onError?: (message: string) => void
  ) => void;
};

const MockForm: React.FC<Props> = ({
  formData,
  setFormData,
  editingId,
  includeTimestamp,
  setIncludeTimestamp,
  onSubmit,
  onCancelEdit,
  formatJsonField,
}) => {
  return (
    <form className="mock-form" onSubmit={onSubmit}>
      <h3>{editingId ? "Edit Mock" : "Add New Mock"}</h3>

      <div className="form-group-pair">
        <label className="form-label-column">Method:</label>
        <div className="form-input-column">
          <select
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
      </div>

      <div className="form-group-pair">
        <label className="form-label-column">Endpoint Path:</label>
        <div className="form-input-column">
          <input
            type="text"
            name="endpoint"
            placeholder="/v3/something"
            value={formData.endpoint}
            onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
            onBlur={(e) => setFormData({ ...formData, endpoint: e.target.value.trim() })}
          />
        </div>
      </div>

      <div className="form-group-pair">
        <label className="form-label-column">Response Headers (JSON):</label>
        <div className="form-input-column">
          <textarea
            name="headers"
            value={formData.headers}
            onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
            onBlur={() =>
              formatJsonField(
                formData.headers,
                (formatted) => setFormData((prev: any) => ({ ...prev, headers: formatted })),
                (message) => alert(message)
              )
            }
            rows={4}
          />
        </div>
      </div>

      <div className="form-group-pair">
        <label className="form-label-column">Response Body (JSON or text):</label>
        <div className="form-input-column">
          <textarea
            name="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            onBlur={() =>
              formatJsonField(
                formData.body,
                (formatted) => setFormData((prev: any) => ({ ...prev, body: formatted })),
                (message) => alert(message)
              )
            }
            rows={4}
          />
        </div>
      </div>

      <div className="form-group-pair">
        <label className="form-label-column">Transaction Time:</label>
        <div className="form-input-column checkbox">
          <input
            type="checkbox"
            checked={includeTimestamp}
            onChange={() => setIncludeTimestamp(!includeTimestamp)}
          />
        </div>
      </div>

      <div className="form-group-pair">
        <label className="form-label-column">Status Code:</label>
        <div className="form-input-column">
          <input
            type="number"
            name="status"
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

      <div className="form-actions">
        <button type="submit">{editingId ? "Update Mock" : "Add Mock"}</button>
        {editingId && (
          <button type="button" className="cancel-button" onClick={onCancelEdit}>
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
};

export default MockForm;
