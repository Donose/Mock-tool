import { useEffect, useRef } from "react";

type Opts = {
  onSave: () => void | Promise<void>;
  enabled?: boolean;
  isDirty: () => boolean;
  preventDefault?: boolean;
};

export default function useSaveShortcut({
  onSave,
  enabled = true,
  isDirty,
  preventDefault = true,
}: Opts) {
  const onSaveRef = useRef(onSave);
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    onSaveRef.current = onSave;
    isDirtyRef.current = isDirty;
  }, [onSave, isDirty]);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const key = (e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        if (preventDefault) e.preventDefault();
        if (typeof isDirtyRef.current === "function" && !isDirtyRef.current()) return;
        Promise.resolve(onSaveRef.current()).catch((err) => {
          console.error("save shortcut failed:", err);
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, preventDefault]);
}
