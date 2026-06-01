"use client";

import { ToggleLeft, ToggleRight } from "lucide-react";

interface EnableDisableButtonProps {
  enabled: boolean;
  onClick: () => void;
  disabled?: boolean;
  responsive?: boolean;
}

export default function EnableDisableButton({
  enabled,
  onClick,
  disabled = false,
  responsive = false,
}: Readonly<EnableDisableButtonProps>) {
  const label = enabled ? "Deshabilitar" : "Habilitar";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled
          ? "bg-rose-50 ring-rose-300 text-rose-700 hover:bg-rose-100"
          : "bg-emerald-50 ring-emerald-300 text-emerald-700 hover:bg-emerald-100"
      }`}
    >
      {enabled ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
      {responsive ? (
        <span className="hidden xl:block">{label}</span>
      ) : (
        label
      )}
    </button>
  );
}
