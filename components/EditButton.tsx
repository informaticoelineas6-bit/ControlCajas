"use client";

import { Pencil } from "lucide-react";

interface EditButtonProps {
  onClick: () => void;
  disabled?: boolean;
  responsive?: boolean;
}

export default function EditButton({
  onClick,
  disabled = false,
  responsive = false,
}: Readonly<EditButtonProps>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 ring-1 ring-sky-300 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Pencil size={12} />
      {responsive ? (
        <span className="hidden xl:block">Editar</span>
      ) : (
        "Editar"
      )}
    </button>
  );
}
