"use client";

import { frontendClient } from "@/lib/client";
import {
  CAJAS_ARRAY,
  COLECCIONES,
  COLORES_CAJAS,
  Entrega,
  TABLAS,
  TIPOS_EVENTO,
  Usuario,
} from "@/lib/constants";
import { AjusteStr, applyAjuste } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export default function TablaEntrega({
  usuario,
  fecha,
  onAjustar,
}: Readonly<{
  usuario: Usuario;
  fecha: string;
  onAjustar?: (tipo: TIPOS_EVENTO, id: number) => void;
}>) {
  const [datos, setDatos] = useState<AjusteStr<Entrega>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDatos = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.ENTREGA}`,
          { signal },
        );
        const data = await res.json();
        if (res.ok) {
          setDatos(data.map(applyAjuste));
        } else {
          setError(data.error || "Error al cargar eventos");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setError("Error en el servidor");
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [fecha],
  );

  useEffect(() => {
    const abortController = new AbortController();

    fetchDatos(abortController.signal);

    const channel = frontendClient
      .channel(`${TABLAS.ENTREGA}_changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.ENTREGA },
        () => {
          fetchDatos(abortController.signal);
        },
      )
      .subscribe();

    return () => {
      abortController.abort();
      channel.unsubscribe();
    };
  }, [fetchDatos]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(14,165,233,0.1),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Entrega al Centro de Distribución
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Entregas
            </h3>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {datos.length} eventos
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {datos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No hay eventos para esta fecha
                </div>
              ) : (
                datos.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {item.provincia ? "Provincia" : "Centro"}
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-slate-900">
                          {(item.provincia
                            ? item.provincia
                            : item.centro_distribucion) ?? "-"}
                        </h4>
                      </div>
                      {usuario.rol === "informatico" && (
                        <button
                          className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-200"
                          onClick={() => onAjustar?.("Entrega", item.id)}
                        >
                          Ajustar
                        </button>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Chofer</p>
                        <p className="font-medium text-slate-700">
                          {item.nombre ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Chapa</p>
                        <p className="font-medium text-slate-700">
                          {item.chapa ?? "-"}
                        </p>
                      </div>
                      {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                        <div key={color}>
                          <p className="text-slate-500 capitalize">{color}</p>
                          <p className="font-medium text-slate-700">
                            {item.cajas?.[color] ?? "-"}
                          </p>
                        </div>
                      ))}
                      <div>
                        <p className="text-slate-500">Ajustado por</p>
                        <p className="font-medium text-slate-700">
                          {item.ajuste ?? "-"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Centro
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Chofer
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">Chapa</th>
                    {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                      <th
                        key={color}
                        className="px-5 py-4 text-center font-semibold capitalize"
                      >
                        {color}
                      </th>
                    ))}
                    <th className="px-5 py-4 text-center font-semibold">
                      Ajustado por
                    </th>
                    {usuario.rol === "informatico" && (
                      <th className="px-5 py-4 text-center font-semibold">
                        Acción
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {datos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={usuario.rol === "informatico" ? 8 : 6}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No hay eventos para esta fecha
                      </td>
                    </tr>
                  ) : (
                    datos.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100 transition hover:bg-sky-50/40"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {(item.provincia
                            ? item.provincia
                            : item.centro_distribucion) ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.nombre ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.chapa ?? "-"}
                        </td>
                        {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                          <td
                            key={color}
                            className="px-5 py-4 text-center text-slate-700"
                          >
                            {item.cajas[color] ?? "-"}
                          </td>
                        ))}
                        <td className="px-5 py-4 text-center text-slate-500">
                          {item.ajuste ?? "-"}
                        </td>
                        {usuario.rol === "informatico" && (
                          <td className="px-5 py-4 text-center">
                            <button
                              className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-200"
                              onClick={() => onAjustar?.("Entrega", item.id)}
                            >
                              Ajustar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
