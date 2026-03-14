"use client";

import { Usuario } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Alerta from "./Alerta";

interface HeaderProps {
  usuario?: Usuario;
}

export default function Header({ usuario }: Readonly<HeaderProps>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(120deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.94),_rgba(14,165,233,0.88))] text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.95)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 shadow-inner ring-1 ring-white/10">
            <span className="text-lg font-bold">CC</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-100/70">
              Plataforma operativa
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              ControlCajas
            </h1>
          </div>
        </div>

        {usuario && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {usuario.rol === "informatico" && <Alerta usuario={usuario} />}
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-sm font-semibold text-white">
                {usuario.nombre}
              </p>
              <p className="mt-1 text-xs capitalize text-sky-100/75">
                {usuario.rol}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(244,63,94,0.8)] transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {loading ? "Saliendo..." : "Salir"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
