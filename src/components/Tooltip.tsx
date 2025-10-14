import { useState } from "react";

export default function Tooltip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center gap-1">
      <span className="font-medium">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-5 w-5 rounded-full border text-xs leading-4"
        aria-label={`Info: ${label}`}
        title={text}
      >
        i
      </button>
      {open && (
        <span className="absolute z-10 top-full mt-2 w-72 text-sm bg-white border rounded p-2 shadow">
          {text}
        </span>
      )}
    </span>
  );
}
