"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface FormModalProps {
  children: ReactNode;
  description: string;
  headerClassName: string;
  icon: ReactNode;
  isBusy?: boolean;
  isOpen: boolean;
  onDismiss: () => void;
  title: string;
}

export default function FormModal({
  children,
  description,
  headerClassName,
  icon,
  isBusy = false,
  isOpen,
  onDismiss,
  title,
}: Readonly<FormModalProps>) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) {
        onDismiss();
      }
    };

    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [isBusy, isOpen, onDismiss]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-slate-200/80 bg-white shadow-2xl">
        <div
          className={`border-b border-slate-200 px-6 py-5 ${headerClassName}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                {icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{description}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar"
              disabled={isBusy}
              onClick={onDismiss}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
