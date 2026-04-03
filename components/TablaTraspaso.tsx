"use client";

import { COLECCIONES, TIPOS_EVENTO, Traspaso, Usuario } from "@/lib/constants";
import { AjusteStr } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export default function TablaTraspaso({
  usuario,
  fecha,
  onAjustar,
}: Readonly<{
  usuario: Usuario;
  fecha: string;
  onAjustar?: (tipo: TIPOS_EVENTO, id: string) => void;
}>) {
  const [datos, setDatos] = useState<AjusteStr<Traspaso>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.TRASPASO}`,
      );
      const data = await res.json();
      if (res.ok) {
        setDatos(data);
      } else {
        setError(data.error || "Error al cargar eventos");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    fetchDatos();
    const id = setInterval(fetchDatos, 30000);
    return () => clearInterval(id);
  }, [fetchDatos]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(20,184,166,0.1),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Subida al camión
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Traspasos
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
            <div className="space-y-3 md:hidden">
              {datos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No hay eventos para esta fecha
                </div>
              ) : (
                datos.map((item) => (
                  <article
                    key={item._id}
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
                          onClick={() => onAjustar?.("Traspaso", item._id!)}
                        >
                          Ajustar
                        </button>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Almacén</p>
                        <p className="font-medium text-slate-700">
                          {item.almacen ?? "-"}
                        </p>
                      </div>
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
                      <div>
                        <p className="text-slate-500">Blancas</p>
                        <p className="font-medium text-slate-700">
                          {item.cajas?.blancas ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Negras</p>
                        <p className="font-medium text-slate-700">
                          {item.cajas?.negras ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Verdes</p>
                        <p className="font-medium text-slate-700">
                          {item.cajas?.verdes ?? "-"}
                        </p>
                      </div>
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

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Centro
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Almacén
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Chofer
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">Chapa</th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Blancas
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Negras
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Verdes
                    </th>
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
                        colSpan={usuario.rol === "informatico" ? 9 : 7}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No hay eventos para esta fecha
                      </td>
                    </tr>
                  ) : (
                    datos.map((item) => (
                      <tr
                        key={item._id}
                        className="border-t border-slate-100 transition hover:bg-teal-50/40"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {(item.provincia
                            ? item.provincia
                            : item.centro_distribucion) ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.almacen ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.nombre ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.chapa ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700">
                          {item.cajas?.blancas ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700">
                          {item.cajas?.negras ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700">
                          {item.cajas?.verdes ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-500">
                          {item.ajuste ?? "-"}
                        </td>
                        {usuario.rol === "informatico" && (
                          <td className="px-5 py-4 text-center">
                            <button
                              className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-200"
                              onClick={() => onAjustar?.("Traspaso", item._id!)}
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
