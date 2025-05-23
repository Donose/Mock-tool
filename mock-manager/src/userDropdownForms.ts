import { useState, useCallback } from "react";
import { Field, platforms } from "./platformConfig";

type Values = Record<string, Record<Field, string>>;

export default function useDropdownForms() {
  const [open, setOpen] = useState<string | null>(null);
  const [values, setValues] = useState<Values>({});

  const toggle = useCallback((id: string) => {
    setOpen((o) => (o === id ? null : id));
  }, []);

  const update = useCallback(
    (id: string, field: Field, val: string) =>
      setValues((v) => ({
        ...v,
        [id]: { ...v[id], [field]: val },
      })),
    []
  );

  return { platforms, open, toggle, values, update };
}
