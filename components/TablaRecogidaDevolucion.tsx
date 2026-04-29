"use client";

import { frontendClient } from "@/lib/client";
import {
  CAJAS_ARRAY,
  COLORES_CAJAS,
  COLORES_TAPAS,
  ItemComparacionRecogida,
  TABLAS,
  TAPAS_ARRAY,
} from "@/lib/constants";
import { totalCajas } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export default function TablaRecogidaDevolucion({
  fecha,
  datos = [],
  setDatos,
}: Readonly<{
  fecha: string;
  datos: ItemComparacionRecogida[];
  setDatos: (datos: ItemComparacionRecogida[]) => void;
}>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDatos = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/eventos/comparar?fecha=${fecha}&tipo=devolucion_recogida`,
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
      .channel("devolucion_recogida_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.RECOGIDA },
        debouncedFetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.DEVOLUCION },
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
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(99,102,241,0.09),_rgba(251,191,36,0.08),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Comparación operativa
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Recogida - Devolución
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
                        : item.rotura
                          ? "border-amber-200 bg-amber-100"
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
                    <div className="mt-3 rounded-xl bg-indigo-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                        Recogida
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div className="md:col-span-2">
                          <p className="text-slate-500">Responsable</p>
                          <p className="font-medium text-slate-700">
                            {item.recogida?.nombre ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Ajuste</p>
                          <p className="font-medium text-slate-700">
                            {item.recogida?.ajuste ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cajas</p>
                          <p className="font-medium text-slate-700">
                            {CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                              const capitalize =
                                color.charAt(0).toUpperCase() + color.slice(1);
                              return `${capitalize}: ${item.recogida?.cajas[color] ?? 0}`;
                            }).join("\n") +
                              `\nTotal: ${item.recogida ? totalCajas(item.recogida.cajas) : 0}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 rounded-xl bg-amber-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                        Devolución
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div className="md:col-span-2">
                          <p className="text-slate-500">Responsable</p>
                          <p className="font-medium text-slate-700">
                            {item.devolucion?.nombre ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Ajuste</p>
                          <p className="font-medium text-slate-700">
                            {item.devolucion?.ajuste ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cajas</p>
                          <p className="font-medium text-slate-700">
                            {CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                              const capitalize =
                                color.charAt(0).toUpperCase() + color.slice(1);
                              return `${capitalize}: ${item.devolucion?.cajas[color] ?? 0}`;
                            }).join("\n") +
                              `\nTotal: ${item.devolucion ? totalCajas(item.devolucion.cajas) : 0}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 rounded-xl bg-rose-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-700">
                        Roturas
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-500">Recogida</p>
                          <p className="font-medium text-slate-700">
                            {`Cajas ${CAJAS_ARRAY.map(
                              (color: COLORES_CAJAS) => {
                                const capitalize =
                                  color.charAt(0).toUpperCase() +
                                  color.slice(1);
                                return `${capitalize}: ${item.recogida?.roturas.cajas[color] ?? 0}`;
                              },
                            ).join("\n")}\nTapas ${TAPAS_ARRAY.map(
                              (color: COLORES_TAPAS) => {
                                const capitalize =
                                  color.charAt(0).toUpperCase() +
                                  color.slice(1);
                                return `${capitalize}: ${item.recogida?.roturas.tapas[color] ?? 0}`;
                              },
                            ).join("\n")}\nTotal: ${
                              item.recogida
                                ? totalCajas(item.recogida.roturas.cajas) +
                                  totalCajas(item.recogida.roturas.tapas)
                                : 0
                            }`}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Devolucion</p>
                          <p className="font-medium text-slate-700">
                            {`Cajas ${CAJAS_ARRAY.map(
                              (color: COLORES_CAJAS) => {
                                const capitalize =
                                  color.charAt(0).toUpperCase() +
                                  color.slice(1);
                                return `${capitalize}: ${item.devolucion?.roturas.cajas[color] ?? 0}`;
                              },
                            ).join("\n")}\nTapas ${TAPAS_ARRAY.map(
                              (color: COLORES_TAPAS) => {
                                const capitalize =
                                  color.charAt(0).toUpperCase() +
                                  color.slice(1);
                                return `${capitalize}: ${item.devolucion?.roturas.tapas[color] ?? 0}`;
                              },
                            ).join("\n")}\nTotal: ${
                              item.devolucion
                                ? totalCajas(item.devolucion.roturas.cajas) +
                                  totalCajas(item.devolucion.roturas.tapas)
                                : 0
                            }`}
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
                      className="px-5 py-4 text-center font-semibold text-indigo-700 bg-indigo-100"
                    >
                      Recogida
                    </th>
                    <th
                      colSpan={3}
                      className="px-5 py-4 text-center font-semibold text-amber-700 bg-amber-100"
                    >
                      Devolución
                    </th>
                    <th
                      colSpan={2}
                      className="px-5 py-4 text-center font-semibold text-rose-700 bg-rose-100"
                    >
                      Roturas
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
                      Total (R)
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Total (D)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={15}
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
                            : item.rotura
                              ? "from-amber-200 to-amber-50 hover:bg-amber-100/70"
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
                          {item.recogida?.nombre ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-500">
                          {item.recogida?.ajuste ?? "-"}
                        </td>
                        <td
                          title={CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                            const capitalize =
                              color.charAt(0).toUpperCase() + color.slice(1);
                            return `${capitalize}: ${item.recogida?.cajas[color] ?? 0}`;
                          }).join("\n")}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {item.recogida ? totalCajas(item.recogida?.cajas) : 0}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-600">
                          {item.devolucion?.nombre ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-500">
                          {item.devolucion?.ajuste ?? "-"}
                        </td>
                        <td
                          title={CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                            const capitalize =
                              color.charAt(0).toUpperCase() + color.slice(1);
                            return `${capitalize}: ${item.devolucion?.cajas[color] ?? 0}`;
                          }).join("\n")}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {item.devolucion
                            ? totalCajas(item.devolucion?.cajas)
                            : 0}
                        </td>
                        <td
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                          title={`Cajas ${CAJAS_ARRAY.map(
                            (color: COLORES_CAJAS) => {
                              const capitalize =
                                color.charAt(0).toUpperCase() + color.slice(1);
                              return `${capitalize}: ${item.recogida?.roturas.cajas[color] ?? 0}`;
                            },
                          ).join("\n")}\nTapas ${TAPAS_ARRAY.map(
                            (color: COLORES_TAPAS) => {
                              const capitalize =
                                color.charAt(0).toUpperCase() + color.slice(1);
                              return `${capitalize}: ${item.recogida?.roturas.tapas[color] ?? 0}`;
                            },
                          ).join("\n")}`}
                        >
                          {item.recogida
                            ? totalCajas(item.recogida.roturas.cajas) +
                              totalCajas(item.recogida.roturas.tapas)
                            : "-"}
                        </td>
                        <td
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                          title={`Cajas ${CAJAS_ARRAY.map(
                            (color: COLORES_CAJAS) => {
                              const capitalize =
                                color.charAt(0).toUpperCase() + color.slice(1);
                              return `${capitalize}: ${item.devolucion?.roturas.cajas[color] ?? 0}`;
                            },
                          ).join("\n")}\nTapas ${TAPAS_ARRAY.map(
                            (color: COLORES_TAPAS) => {
                              const capitalize =
                                color.charAt(0).toUpperCase() + color.slice(1);
                              return `${capitalize}: ${item.devolucion?.roturas.tapas[color] ?? 0}`;
                            },
                          ).join("\n")}`}
                        >
                          {item.devolucion
                            ? totalCajas(item.devolucion.roturas.cajas) +
                              totalCajas(item.devolucion.roturas.tapas)
                            : "-"}
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
