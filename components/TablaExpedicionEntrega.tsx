"use client";

import { frontendClient } from "@/lib/client";
import {
  CAJAS_ARRAY,
  COLORES_CAJAS,
  ItemComparacionEntrega,
  TABLAS,
} from "@/lib/constants";
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

  const fetchDatos = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/eventos/comparar?fecha=${fecha}&tipo=expedicion_entrega`,
          { signal },
        );
        const data = await response.json();
        if (response.ok) {
          setDatos(data);
        } else {
          setError(data.error || "Error al cargar datos");
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
    [fecha, setDatos],
  );

  useEffect(() => {
    const abortController = new AbortController();

    fetchDatos(abortController.signal);

    let fetchTimeout: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        fetchDatos(abortController.signal);
      }, 200);
    };

    const channel = frontendClient
      .channel("expedicion_entrega_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.EXPEDICION },
        debouncedFetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.TRASPASO },
        debouncedFetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.ENTREGA },
        debouncedFetch,
      )
      .subscribe();

    return () => {
      abortController.abort();
      clearTimeout(fetchTimeout);
      channel.unsubscribe();
    };
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
          <>
            <div className="space-y-3 p-4 lg:hidden">
              {datos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No hay datos para esta fecha
                </div>
              ) : (
                datos.map((item) => (
                  <article
                    key={item.centro_distribucion}
                    className={`rounded-[24px] border p-4 shadow-sm ${
                      item.alerta
                        ? "border-rose-200 bg-rose-100"
                        : "border-slate-200 bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Centro
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-slate-900">
                          {item.centro_distribucion ?? "-"}
                        </h4>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-500">Almacén</p>
                        <p className="font-medium text-slate-700">
                          {item.almacen ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Chapa</p>
                        <p className="font-medium text-slate-700">
                          {item.chapa ?? "-"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        Expedición
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div className="md:col-span-2">
                          <p className="text-slate-500">Responsable</p>
                          <p className="font-medium text-slate-700">
                            {item.expedicion?.nombre ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Ajuste</p>
                          <p className="font-medium text-slate-700">
                            {item.expedicion?.ajuste ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cajas</p>
                          <p className="font-medium text-slate-700">
                            {CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                              const capitalize =
                                color.charAt(0).toUpperCase() + color.slice(1);
                              return `${capitalize}: ${item.expedicion?.cajas[color] ?? 0}`;
                            }).join("\n") +
                              "\nTotal: " +
                              (item.expedicion?.cajas
                                ? totalCajas(item.expedicion.cajas)
                                : 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 rounded-xl bg-teal-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                        Traspaso
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div className="md:col-span-2">
                          <p className="text-slate-500">Responsable</p>
                          <p className="font-medium text-slate-700">
                            {item.traspaso?.nombre ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Ajuste</p>
                          <p className="font-medium text-slate-700">
                            {item.traspaso?.ajuste ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cajas</p>
                          <p className="font-medium text-slate-700">
                            {CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                              const capitalize =
                                color.charAt(0).toUpperCase() + color.slice(1);
                              return `${capitalize}: ${item.traspaso?.cajas[color] ?? 0}`;
                            }).join("\n") +
                              "\nTotal: " +
                              (item.traspaso?.cajas
                                ? totalCajas(item.traspaso.cajas)
                                : 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 rounded-xl bg-sky-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-700">
                        Entrega
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div className="md:col-span-2">
                          <p className="text-slate-500">Responsable</p>
                          <p className="font-medium text-slate-700">
                            {item.entrega?.nombre ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Ajuste</p>
                          <p className="font-medium text-slate-700">
                            {item.entrega?.ajuste ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cajas</p>
                          <p className="font-medium text-slate-700">
                            {CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                              const capitalize =
                                color.charAt(0).toUpperCase() + color.slice(1);
                              return `${capitalize}: ${item.entrega?.cajas[color] ?? 0}`;
                            }).join("\n") +
                              "\nTotal: " +
                              (item.entrega?.cajas
                                ? totalCajas(item.entrega.cajas)
                                : 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="hidden overflow-x-auto lg:block">
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
                    <th className="px-5 py-3 text-left font-semibold">
                      Almacén
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">Chapa</th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Responsable
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Ajuste
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Total
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Responsable
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Ajuste
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Total
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Responsable
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Ajuste
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Total
                    </th>
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
                            ? "from-rose-200 to-rose-50 hover:bg-rose-100/70"
                            : "hover:bg-slate-100"
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
                          title={CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                            const capitalize =
                              color.charAt(0).toUpperCase() + color.slice(1);
                            return `${capitalize}: ${item.expedicion?.cajas[color] ?? 0}`;
                          }).join("\n")}
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
                          title={CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                            const capitalize =
                              color.charAt(0).toUpperCase() + color.slice(1);
                            return `${capitalize}: ${item.traspaso?.cajas[color] ?? 0}`;
                          }).join("\n")}
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
                          title={CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                            const capitalize =
                              color.charAt(0).toUpperCase() + color.slice(1);
                            return `${capitalize}: ${item.entrega?.cajas[color] ?? 0}`;
                          }).join("\n")}
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
          </>
        )}
      </div>
    </section>
  );
}
