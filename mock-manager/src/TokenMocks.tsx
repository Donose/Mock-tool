import PlatformDropdown from "./PlatformDropdown";
import useDropdownForms from "./userDropdownForms";

export default function TokenMocks() {
  const { platforms, open, toggle, values, update } = useDropdownForms();

  return (
    <div className="space-y-4">
      {platforms.map((p) => (
        <PlatformDropdown
          key={p.id}
          id={p.id}
          label={p.label}
          fields={p.fields}
          open={open === p.id}
          values={values[p.id]}
          onToggle={() => toggle(p.id)}
          onChange={(f, v) => update(p.id, f, v)}
        />
      ))}
    </div>
  );
}
