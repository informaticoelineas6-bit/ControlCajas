"use client";

import { ClipboardPen } from "lucide-react";

interface AdjustButtonProps {
  onClick: () => void;
  disabled?: boolean;
  responsive?: boolean;
}

export default function AdjustButton({
  onClick,
  disabled = false,
  responsive = false,
}: Readonly<AdjustButtonProps>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 ring-1 ring-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ClipboardPen size={12} />
      {responsive ? (
        <span className="hidden xl:block">Ajustar</span>
      ) : (
        "Ajustar"
      )}
    </button>
  );
}
