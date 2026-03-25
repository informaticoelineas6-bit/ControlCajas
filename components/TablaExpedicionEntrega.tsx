"use client";

import { ItemComparacionEntrega } from "@/lib/constants";
import { totalCajas } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export default function TablaExpedicionEntrega({
  fecha,
  datos = [],
  setDatos,
}: Readonly<{
  fecha: string;
  datos: ItemComparacionEntrega[];
  setDatos: (datos: ItemComparacionEntrega[]) => void;
}>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/comparar?fecha=${fecha}&tipo=expedicion_entrega`,
      );
      const data = await response.json();
      if (response.ok) {
        setDatos(data);
      } else {
        setError(data.error || "Error al cargar datos");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  }, [fecha, setDatos]);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(34,197,94,0.09),_rgba(14,165,233,0.08),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Comparación operativa
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Expedición - Entrega
            </h3>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {datos.length} centros
          </span>
        </div>
      </div>

      <div>
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th
                    colSpan={3}
                    className="px-5 py-4 text-left font-semibold bg-slate-100"
                  >
                    Centro de distribución
                  </th>
                  <th
                    colSpan={3}
                    className="px-5 py-4 text-center font-semibold text-emerald-700 bg-emerald-100"
                  >
                    Expedición
                  </th>
                  <th
                    colSpan={3}
                    className="px-5 py-4 text-center font-semibold text-teal-700 bg-teal-100"
                  >
                    Traspaso
                  </th>
                  <th
                    colSpan={3}
                    className="px-5 py-4 text-center font-semibold text-sky-700 bg-sky-100"
                  >
                    Entrega
                  </th>
                </tr>
                <tr className="bg-slate-100 text-slate-500">
                  <th className="px-5 py-3 text-left font-semibold">CD</th>
                  <th className="px-5 py-3 text-left font-semibold">Almacén</th>
                  <th className="px-5 py-3 text-left font-semibold">Chapa</th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Responsable
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Ajuste
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">Total</th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Responsable
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Ajuste
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">Total</th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Responsable
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Ajuste
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {datos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No hay datos para esta fecha
                    </td>
                  </tr>
                ) : (
                  datos.map((item) => (
                    <tr
                      key={item.centro_distribucion}
                      className={`border-t border-slate-100 transition ${
                        item.alerta
                          ? "bg-rose-50 hover:bg-rose-100/70"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {item.centro_distribucion ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {item.almacen ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {item.chapa ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-center text-slate-600">
                        {item.expedicion?.nombre ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-center text-slate-500">
                        {item.expedicion?.ajuste ?? "-"}
                      </td>
                      <td
                        title={`Blancas: ${item.expedicion?.cajas.blancas ?? 0}, Negras: ${item.expedicion?.cajas.negras ?? 0}, Verdes: ${item.expedicion?.cajas.verdes ?? 0}`}
                        className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                      >
                        {item.expedicion?.cajas
                          ? totalCajas(item.expedicion?.cajas)
                          : 0}
                      </td>
                      <td className="px-5 py-4 text-center text-slate-600">
                        {item.traspaso?.nombre ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-center text-slate-500">
                        {item.traspaso?.ajuste ?? "-"}
                      </td>
                      <td
                        title={`Blancas: ${item.traspaso?.cajas.blancas ?? 0}, Negras: ${item.traspaso?.cajas.negras ?? 0}, Verdes: ${item.traspaso?.cajas.verdes ?? 0}`}
                        className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                      >
                        {item.traspaso?.cajas
                          ? totalCajas(item.traspaso?.cajas)
                          : 0}
                      </td>
                      <td className="px-5 py-4 text-center text-slate-600">
                        {item.entrega?.nombre ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-center text-slate-500">
                        {item.entrega?.ajuste ?? "-"}
                      </td>
                      <td
                        title={`Blancas: ${item.entrega?.cajas.blancas ?? 0}, Negras: ${item.entrega?.cajas.negras ?? 0}, Verdes: ${item.entrega?.cajas.verdes ?? 0}`}
                        className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                      >
                        {item.entrega?.cajas
                          ? totalCajas(item.entrega?.cajas)
                          : 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
