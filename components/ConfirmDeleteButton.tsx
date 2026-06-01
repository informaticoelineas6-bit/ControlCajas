"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertTriangle, X } from "lucide-react";

interface ConfirmDeleteButtonProps {
  entityName: string;
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
  buttonLabel?: string;
}

export default function ConfirmDeleteButton({
  entityName,
  onConfirm,
  disabled = false,
  buttonLabel = "Eliminar",
}: Readonly<ConfirmDeleteButtonProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        setIsOpen(false);
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [isDeleting, isOpen]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-300 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={12} />
        <span className="hidden sm:block lg:hidden xl:block">{buttonLabel}</span>
      </button>
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                  <AlertTriangle size={18} className="text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Confirmar eliminación
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Esta acción eliminará {entityName} de forma permanente.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={14} />
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
