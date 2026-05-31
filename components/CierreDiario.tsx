"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Cierre,
  Cajas,
  Usuario,
  CajasRoturas,
  CAJAS_ARRAY,
  TAPAS_ARRAY,
  COLORES_CAJAS,
  COLORES_TAPAS,
  TABLAS,
} from "@/lib/constants";
import {
  ItemComparacionEntrega,
  ItemComparacionRecogida,
} from "@/lib/compares";
import {
  formatCajas,
  formatNumber,
  formatTapas,
  totalCajas,
} from "@/lib/utils";
import { colorStyles } from "@/app/(app)/layout";
import { frontendClient } from "@/lib/client";

export default function CierreDiario({
  fecha,
  usuario,
  expedicionEntregaData,
  recogidaDevolucionData,
  parentLoading = false,
  parentError = "",
  cierreExistente = false,
}: Readonly<{
  fecha: string;
  usuario: Usuario;
  expedicionEntregaData: ItemComparacionEntrega[];
  recogidaDevolucionData: ItemComparacionRecogida[];
  parentLoading: boolean;
  parentError: string;
  cierreExistente: boolean;
}>) {
  const [cierre, setCierre] = useState<Cierre>({
    fecha,
    cierre_cd: [],
    cierre_almacen: [],
  });
  const [alertas, setAlertas] = useState<boolean>(false);
  const [advertencias, setAdvertencias] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cierreExistente || parentLoading || parentError) {
      setAlertas(false);
      setAdvertencias(false);
    } else {
      setAlertas(
        expedicionEntregaData.some((item) => item.alerta) ||
          recogidaDevolucionData.some((item) => item.alerta),
      );
      setAdvertencias(
        expedicionEntregaData.some((item) => item.advertencia) ||
          recogidaDevolucionData.some((item) => item.advertencia),
      );
    }
  }, [
    cierreExistente,
    expedicionEntregaData,
    parentError,
    parentLoading,
    recogidaDevolucionData,
  ]);

  const nuevoCierre = useCallback(
    ({
      stockMap,
      deudaMap,
    }: {
      stockMap: Record<string, { cajas: Cajas; roturas: CajasRoturas }>;
      deudaMap: Record<string, { cajas: Cajas; roturas: CajasRoturas }>;
    }): Cierre => {
      return {
        fecha,
        cierre_cd: Object.entries(deudaMap).map(([cd, data]) => ({
          centro_distribucion: cd,
          ajuste_deuda: data.cajas,
          roturas: { cajas: data.roturas.cajas, tapas: data.roturas.tapas },
        })),
        cierre_almacen: Object.entries(stockMap).map(([almacen, data]) => ({
          almacen,
          ajuste_stock: data.cajas,
          roturas: { cajas: data.roturas.cajas, tapas: data.roturas.tapas },
        })),
      };
    },
    [fecha],
  );

  const fetchDatos = useCallback(
    async (signal: AbortSignal) => {
      if (parentLoading || parentError) {
        setLoading(false);
        setError("");
        setCierre({ fecha, cierre_cd: [], cierre_almacen: [] });
        return;
      }
      setLoading(true);
      setError("");
      try {
        if (cierreExistente) {
          const respCierre = await fetch(`/api/eventos/cierre?fecha=${fecha}`, {
            signal,
          });
          const dataCierre = await respCierre.json();

          if (respCierre.ok) {
            setCierre(dataCierre);
          } else {
            setError(dataCierre.error || "Error al cargar cierre");
          }
        } else {
          const respCierre = await fetch(`/api/admin/cierre?fecha=${fecha}`, {
            signal,
          });
          const dataCierre = await respCierre.json();

          if (respCierre.ok) {
            setCierre(nuevoCierre(dataCierre));
          } else {
            setError(dataCierre.error || "Error al cargar cierre");
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setError("Error al cargar datos");
        console.error(error);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [cierreExistente, fecha, nuevoCierre, parentError, parentLoading],
  );

  useEffect(() => {
    const abortController = new AbortController();

    fetchDatos(abortController.signal);

    const channel = frontendClient
      .channel("cierre_changes_diario")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.CIERRE },
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

  const handleCrearCierre = async () => {
    const confirmar = globalThis.confirm(
      `¿Deseas crear el Cierre para el día ${fecha}?\nUna vez cerrado el día no es posible registrar nuevos eventos.\nEsta acción no se puede deshacer.`,
    );
    if (!confirmar) return;

    setLoading(true);
    try {
      const response = await fetch("/api/eventos/cierre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cierre),
      });

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || "Error al crear cierre");
      }
    } catch (error) {
      setError("Error al crear cierre");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6 rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Consolidación diaria
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">
            Cierre diario
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Resume ajustes de stock y deuda generados por el cruce del día.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              cierreExistente
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {cierreExistente ? "Día cerrado" : "Pendiente de cierre"}
          </span>
          {!cierreExistente && usuario.rol === "informatico" && (
            <button
              onClick={handleCrearCierre}
              disabled={loading || alertas}
              className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(37,99,235,0.9)] transition hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear cierre"}
            </button>
          )}
        </div>
      </div>

      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {alertas && !loading ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          ⚠️ Existen inconsistencias críticas en los datos. No se puede crear un
          nuevo cierre hasta que se resuelvan.
        </div>
      ) : advertencias ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          ⚠️ Existen inconsistencias en los datos. Se recomienda resolverlas
          antes de crear un nuevo cierre.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/70">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <h4 className="text-lg font-semibold text-slate-900">
              Almacenes - Ajuste de stock
            </h4>
          </div>
          <div className="space-y-3 p-4 lg:hidden">
            {cierre.cierre_almacen.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                {loading || parentLoading ? "Cargando..." : "No hay datos"}
              </div>
            ) : (
              cierre.cierre_almacen.map((item) => (
                <article
                  key={item.almacen}
                  className="rounded-[24px] text-center border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-800">
                    Almacén
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900">
                    {item.almacen}
                  </h4>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                    {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                      <div key={color} className={colorStyles[color].bg}>
                        <p className="text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            {colorStyles[color].icon}
                            Ajuste {color}
                          </span>
                        </p>
                        <p className="stock-number font-medium text-slate-700">
                          {formatNumber(item.ajuste_stock[color], "-")}
                        </p>
                      </div>
                    ))}
                    <div>
                      <p className="text-slate-600">Total</p>
                      <p className="stock-number font-semibold text-slate-700">
                        {formatNumber(totalCajas(item.ajuste_stock))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                    {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                      <div key={color} className={colorStyles[color].bg}>
                        <p className="text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            {colorStyles[color].icon}
                            Cajas rotas {color}
                          </span>
                        </p>
                        <p className="stock-number font-medium text-slate-700">
                          {formatNumber(item.roturas.cajas[color], "-")}
                        </p>
                      </div>
                    ))}
                    {TAPAS_ARRAY.map((color: COLORES_TAPAS) => (
                      <div key={color} className={colorStyles[color].bg}>
                        <p className="text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            {colorStyles[color].icon}
                            Tapas rotas {color}
                          </span>
                        </p>
                        <p className="stock-number font-medium text-slate-700">
                          {formatNumber(item.roturas.tapas[color], "-")}
                        </p>
                      </div>
                    ))}
                    <div>
                      <p className="text-slate-600">Total roturas</p>
                      <p className="stock-number font-medium text-slate-700">
                        {formatNumber(
                          totalCajas(item.roturas.cajas) +
                            totalCajas(item.roturas.tapas),
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-sm text-center">
              <thead className="bg-slate-100 text-slate-800">
                <tr>
                  <th className="px-5 py-4 font-semibold">Almacén</th>
                  {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                    <th
                      key={color}
                      className={
                        "px-5 py-4 font-semibold capitalize" +
                        colorStyles[color].bg
                      }
                    >
                      <span className="inline-flex items-center">
                        {colorStyles[color].icon}
                        {color}
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-4 font-semibold">Total</th>
                  <th className="px-5 py-4 font-semibold">Cajas rotas</th>
                  <th className="px-5 py-4 font-semibold">Tapas rotas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cierre.cierre_almacen.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-slate-500">
                      {loading || parentLoading
                        ? "Cargando..."
                        : "No hay datos"}
                    </td>
                  </tr>
                ) : (
                  cierre.cierre_almacen.map((item) => (
                    <tr
                      key={item.almacen}
                      className="border-t border-slate-100 bg-white transition hover:bg-slate-100"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {item.almacen}
                      </td>
                      {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                        <td
                          key={color}
                          className={
                            "stock-number px-5 py-4 text-slate-700" +
                            colorStyles[color].bg
                          }
                        >
                          {formatNumber(item.ajuste_stock[color], "-")}
                        </td>
                      ))}
                      <td className="stock-number px-5 py-4 font-semibold text-slate-900">
                        {formatNumber(totalCajas(item.ajuste_stock))}
                      </td>
                      <td
                        title={formatCajas(item.roturas.cajas)}
                        className="stock-number px-5 py-4 text-slate-700 hover:bg-slate-300"
                      >
                        {formatNumber(totalCajas(item.roturas.cajas))}
                      </td>
                      <td
                        title={formatTapas(item.roturas.tapas)}
                        className="stock-number px-5 py-4 text-slate-700 hover:bg-slate-300"
                      >
                        {formatNumber(totalCajas(item.roturas.tapas))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/70">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <h4 className="text-lg font-semibold text-slate-900">
              Centros de distribución - Ajuste de deuda
            </h4>
          </div>
          <div className="space-y-3 p-4 lg:hidden">
            {cierre.cierre_cd.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                {loading || parentLoading ? "Cargando..." : "No hay datos"}
              </div>
            ) : (
              cierre.cierre_cd.map((item) => (
                <article
                  key={item.centro_distribucion}
                  className="rounded-[24px] text-center border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-800">
                    Centro
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900">
                    {item.centro_distribucion}
                  </h4>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                    {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                      <div key={color} className={colorStyles[color].bg}>
                        <p className="text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            {colorStyles[color].icon}
                            Ajuste {color}
                          </span>
                        </p>
                        <p className="stock-number font-medium text-slate-700">
                          {formatNumber(item.ajuste_deuda[color], "-")}
                        </p>
                      </div>
                    ))}
                    <div>
                      <p className="text-slate-600">Total</p>
                      <p className="stock-number font-semibold text-slate-700">
                        {formatNumber(totalCajas(item.ajuste_deuda))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                    {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                      <div key={color} className={colorStyles[color].bg}>
                        <p className="text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            {colorStyles[color].icon}
                            Cajas rotas {color}
                          </span>
                        </p>
                        <p className="stock-number font-medium text-slate-700">
                          {formatNumber(item.roturas.cajas[color], "-")}
                        </p>
                      </div>
                    ))}
                    {TAPAS_ARRAY.map((color: COLORES_TAPAS) => (
                      <div key={color} className={colorStyles[color].bg}>
                        <p className="text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            {colorStyles[color].icon}
                            Tapas rotas {color}
                          </span>
                        </p>
                        <p className="stock-number font-medium text-slate-700">
                          {formatNumber(item.roturas.tapas[color], "-")}
                        </p>
                      </div>
                    ))}
                    <div>
                      <p className="text-slate-600">Total roturas</p>
                      <p className="stock-number font-medium text-slate-700">
                        {formatNumber(
                          totalCajas(item.roturas.cajas) +
                            totalCajas(item.roturas.tapas),
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-sm text-center">
              <thead className="bg-slate-100 text-slate-800">
                <tr>
                  <th className="px-5 py-4 font-semibold">Centro</th>
                  {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                    <th
                      key={color}
                      className={
                        "px-5 py-4 font-semibold capitalize" +
                        colorStyles[color].bg
                      }
                    >
                      <span className="inline-flex items-center">
                        {colorStyles[color].icon}
                        {color}
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-4 font-semibold">Total</th>
                  <th className="px-5 py-4 font-semibold">Cajas rotas</th>
                  <th className="px-5 py-4 font-semibold">Tapas rotas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cierre.cierre_cd.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-slate-500">
                      {loading || parentLoading
                        ? "Cargando..."
                        : "No hay datos"}
                    </td>
                  </tr>
                ) : (
                  cierre.cierre_cd.map((item) => (
                    <tr
                      key={item.centro_distribucion}
                      className="border-t border-slate-100 bg-white transition hover:bg-slate-100"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {item.centro_distribucion}
                      </td>
                      {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                        <td
                          key={color}
                          className={
                            "stock-number px-5 py-4 text-slate-700" +
                            colorStyles[color].bg
                          }
                        >
                          {formatNumber(item.ajuste_deuda[color], "-")}
                        </td>
                      ))}
                      <td className="stock-number px-5 py-4 font-semibold text-slate-700">
                        {formatNumber(totalCajas(item.ajuste_deuda))}
                      </td>
                      <td
                        title={formatCajas(item.roturas.cajas)}
                        className="stock-number px-5 py-4 text-slate-700 hover:bg-slate-300"
                      >
                        {formatNumber(totalCajas(item.roturas.cajas))}
                      </td>
                      <td
                        title={formatTapas(item.roturas.tapas)}
                        className="stock-number px-5 py-4 text-slate-700 hover:bg-slate-300"
                      >
                        {formatNumber(totalCajas(item.roturas.tapas))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
