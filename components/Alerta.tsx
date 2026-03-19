"use client";

import { AlertaResponse } from "@/app/api/alerts/route";
import { Usuario } from "@/lib/constants";
import { useCallback, useEffect, useState } from "react";

export default function Alerta({ usuario }: Readonly<{ usuario: Usuario }>) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AlertaResponse>({
    total: 0,
    usuarios_recientes: 0,
    inconsistencias_expedicion_entrega: [],
    inconsistencias_devolucion_recogida: [],
    cierre_pendiente: false,
  });

  const fetchAlerts = useCallback(async () => {
    if (usuario.rol !== "informatico") {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/alerts`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Error al cargar alertas");
        return;
      }
      setData(body);
      setError("");
    } catch {
      setError("Error al cargar alertas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 15000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const fecha = new Date().toISOString().split("T")[0];

  const renderView = () => {
    if (error)
      return (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      );
    if (loading && !data.total)
      return <p className="text-sm text-slate-500">Cargando...</p>;
    if (data.total === 0)
      return (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Sin alertas.
        </p>
      );
    return (
      <div className="space-y-2">
        {data?.cierre_pendiente && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600">
              Aún no se ha realizado el cierre para el día de hoy.
            </p>
          </div>
        )}
        {data?.usuarios_recientes > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Se han creado {data?.usuarios_recientes} usuarios nuevos
              pendientes a ser habilitados.
            </p>
          </div>
        )}
        {data?.inconsistencias_expedicion_entrega
          .concat(data.inconsistencias_devolucion_recogida)
          .map((alerta) => (
            <div
              key={`${alerta.tipo}-${alerta.nombre}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Existe inconsistencias en el centro {alerta.nombre}
              </p>
              <p className="mt-1 text-sm text-slate-700">{alerta.detalle}</p>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <span>{error || "Notificaciones"}</span>
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
          {loading ? "..." : data.total}
        </span>
      </button>

      {open && !error && (
        <div className="absolute right-0 z-40 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Alertas</p>
            <p className="text-xs text-slate-500">Fecha: {fecha}</p>
          </div>

          {renderView()}
        </div>
      )}
    </div>
  );
}
