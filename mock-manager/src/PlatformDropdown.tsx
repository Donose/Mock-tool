/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field } from "./platformConfig";

interface Props {
  id: string;
  label: string;
  fields: Field[];
  open: boolean;
  values: Record<Field, string> | undefined;
  onToggle: () => void;
  onChange: (f: Field, v: string) => void;
}

export default function PlatformDropdown({
  label,
  fields,
  open,
  values,
  onToggle,
  onChange,
}: Props) {
  return (
    <div className="border rounded-xl p-4">
      <button type="button" className="w-full text-left font-medium" onClick={onToggle}>
        {label}
      </button>

      {open && (
        <form className="mt-4 grid gap-3">
          {fields.includes("username") && (
            <input
              className="input"
              placeholder="Username"
              value={values?.username ?? ""}
              onChange={(e) => onChange("username", e.target.value)}
            />
          )}

          {fields.includes("email") && (
            <input
              className="input"
              placeholder="Email"
              value={values?.email ?? ""}
              onChange={(e) => onChange("email", e.target.value)}
            />
          )}

          {fields.includes("age") && (
            <input
              className="input"
              type="number"
              placeholder="Age"
              value={values?.age ?? ""}
              onChange={(e) => onChange("age", e.target.value)}
            />
          )}
        </form>
      )}
    </div>
  );
}
