"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Cierre,
  Cajas,
  Expedicion,
  Entrega,
  Devolucion,
  Recogida,
  ItemComparacionEntrega,
  ItemComparacionRecogida,
  COLECCIONES,
  Usuario,
  CajasRoturas,
  CAJAS_ARRAY,
  TAPAS_ARRAY,
  COLORES_CAJAS,
  COLORES_TAPAS,
  TABLAS,
} from "@/lib/constants";
import { AjusteStr, totalCajas } from "@/lib/utils";
import { frontendClient } from "@/lib/client";

export default function CierreDiario({
  fecha,
  usuario,
  expedicionEntregaData,
  recogidaDevolucionData,
}: Readonly<{
  fecha: string;
  usuario: Usuario;
  expedicionEntregaData: ItemComparacionEntrega[];
  recogidaDevolucionData: ItemComparacionRecogida[];
}>) {
  const [cierre, setCierre] = useState<Cierre>({
    fecha,
    cierre_cd: [],
    cierre_almacen: [],
  });
  const [existente, setExistente] = useState(false);
  const [alertas, setAlertas] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    for (const item of expedicionEntregaData ?? []) {
      if (item.alerta) {
        setAlertas(true);
        return;
      }
    }
    for (const item of recogidaDevolucionData ?? []) {
      if (item.alerta) {
        setAlertas(true);
        return;
      }
    }
    setAlertas(false);
  }, [expedicionEntregaData, recogidaDevolucionData]);

  const calcularAjustesStock = useCallback(
    async (signal: AbortSignal) => {
      const ajustesMap: Record<string, { cajas: Cajas } & CajasRoturas> = {};

      const [devolucionData, expedicionData] = await Promise.all([
        (
          await fetch(
            `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.DEVOLUCION}`,
            { signal },
          )
        ).json() as Promise<AjusteStr<Devolucion>[]>,
        (
          await fetch(
            `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.EXPEDICION}`,
            { signal },
          )
        ).json() as Promise<AjusteStr<Expedicion>[]>,
      ]);

      devolucionData.forEach((item: AjusteStr<Devolucion>) => {
        if (!ajustesMap[item.almacen]) {
          ajustesMap[item.almacen] = {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            roturas: {
              cajas: { blancas: 0, negras: 0, verdes: 0 },
              tapas: { blancas: 0, negras: 0 },
            },
          };
        }
        ajustesMap[item.almacen].cajas.blancas += item.cajas.blancas ?? 0;
        ajustesMap[item.almacen].cajas.negras += item.cajas.negras ?? 0;
        ajustesMap[item.almacen].cajas.verdes += item.cajas.verdes ?? 0;

        ajustesMap[item.almacen].roturas.cajas.blancas +=
          item.roturas.cajas.blancas ?? 0;
        ajustesMap[item.almacen].roturas.cajas.negras +=
          item.roturas.cajas.negras ?? 0;
        ajustesMap[item.almacen].roturas.cajas.verdes +=
          item.roturas.cajas.verdes ?? 0;
        ajustesMap[item.almacen].roturas.tapas.blancas +=
          item.roturas.tapas.blancas ?? 0;
        ajustesMap[item.almacen].roturas.tapas.negras +=
          item.roturas.tapas.negras ?? 0;
      });

      expedicionData.forEach((item: AjusteStr<Expedicion>) => {
        if (!ajustesMap[item.almacen]) {
          ajustesMap[item.almacen] = {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            roturas: {
              cajas: { blancas: 0, negras: 0, verdes: 0 },
              tapas: { blancas: 0, negras: 0 },
            },
          };
        }
        ajustesMap[item.almacen].cajas.blancas -= item.cajas.blancas ?? 0;
        ajustesMap[item.almacen].cajas.negras -= item.cajas.negras ?? 0;
        ajustesMap[item.almacen].cajas.verdes -= item.cajas.verdes ?? 0;
      });

      return ajustesMap;
    },
    [fecha],
  );

  const calcularAjustesDeuda = useCallback(
    async (signal: AbortSignal) => {
      const ajustesMap: Record<string, { cajas: Cajas } & CajasRoturas> = {};

      const [entregaData, recogidaData] = await Promise.all([
        (
          await fetch(
            `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.ENTREGA}`,
            { signal },
          )
        ).json() as Promise<AjusteStr<Entrega>[]>,
        (
          await fetch(
            `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.RECOGIDA}`,
            { signal },
          )
        ).json() as Promise<AjusteStr<Recogida>[]>,
      ]);

      entregaData.forEach((item: AjusteStr<Entrega>) => {
        if (!ajustesMap[item.centro_distribucion]) {
          ajustesMap[item.centro_distribucion] = {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            roturas: {
              cajas: { blancas: 0, negras: 0, verdes: 0 },
              tapas: { blancas: 0, negras: 0 },
            },
          };
        }
        ajustesMap[item.centro_distribucion].cajas.blancas +=
          item.cajas.blancas ?? 0;
        ajustesMap[item.centro_distribucion].cajas.negras +=
          item.cajas.negras ?? 0;
        ajustesMap[item.centro_distribucion].cajas.verdes +=
          item.cajas.verdes ?? 0;
      });

      recogidaData.forEach((item: AjusteStr<Recogida>) => {
        if (!ajustesMap[item.centro_distribucion]) {
          ajustesMap[item.centro_distribucion] = {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            roturas: {
              cajas: { blancas: 0, negras: 0, verdes: 0 },
              tapas: { blancas: 0, negras: 0 },
            },
          };
        }

        ajustesMap[item.centro_distribucion].cajas.blancas -=
          item.cajas.blancas ?? 0;
        ajustesMap[item.centro_distribucion].cajas.negras -=
          item.cajas.negras ?? 0;
        ajustesMap[item.centro_distribucion].cajas.verdes -=
          item.cajas.verdes ?? 0;

        ajustesMap[item.centro_distribucion].roturas.cajas.blancas +=
          item.roturas.cajas.blancas ?? 0;
        ajustesMap[item.centro_distribucion].roturas.cajas.negras +=
          item.roturas.cajas.negras ?? 0;
        ajustesMap[item.centro_distribucion].roturas.cajas.verdes +=
          item.roturas.cajas.verdes ?? 0;
        ajustesMap[item.centro_distribucion].roturas.tapas.blancas +=
          item.roturas.tapas.blancas ?? 0;
        ajustesMap[item.centro_distribucion].roturas.tapas.negras +=
          item.roturas.tapas.negras ?? 0;
      });

      return ajustesMap;
    },
    [fecha],
  );

  const nuevoCierre = useCallback(
    async (signal: AbortSignal): Promise<Cierre> => {
      const [ajustesStock, ajustesDeuda] = await Promise.all([
        calcularAjustesStock(signal),
        calcularAjustesDeuda(signal),
      ]);

      return {
        fecha,
        cierre_cd: Object.entries(ajustesDeuda).map(([cd, data]) => ({
          centro_distribucion: cd,
          ajuste_deuda: data.cajas,
          roturas: { cajas: data.roturas.cajas, tapas: data.roturas.tapas },
        })),
        cierre_almacen: Object.entries(ajustesStock).map(([almacen, data]) => ({
          almacen,
          ajuste_stock: data.cajas,
          roturas: { cajas: data.roturas.cajas, tapas: data.roturas.tapas },
        })),
      };
    },
    [calcularAjustesDeuda, calcularAjustesStock, fecha],
  );

  const fetchDatos = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setExistente(false);
      setError("");
      try {
        const respCierre = await fetch(`/api/eventos/cierre?fecha=${fecha}`, {
          signal,
        });
        const dataCierre = await respCierre.json();

        if (respCierre.ok && dataCierre) {
          setCierre(dataCierre);
          setExistente(true);
        } else if (respCierre.ok) {
          const nuevo: Cierre = await nuevoCierre(signal);
          setCierre(nuevo);
        } else {
          setError(dataCierre.error || "Error al cargar cierre");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError("Error al cargar datos");
        console.error(err);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [fecha, nuevoCierre],
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
      .channel("cierre_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.EXPEDICION },
        debouncedFetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.ENTREGA },
        debouncedFetch,
      )
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.CIERRE },
        debouncedFetch,
      )
      .subscribe();

    return () => {
      abortController.abort();
      clearTimeout(fetchTimeout);
      channel.unsubscribe();
    };
  }, [fetchDatos]);

  const handleCrearCierre = async () => {
    const confirmar = globalThis.confirm(
      `¿Deseas crear el Cierre para el día ${fecha}? Esta acción no se puede deshacer.`,
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
    } catch (err) {
      setError("Error al crear cierre");
      console.error(err);
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
              existente
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {existente ? "Día cerrado" : "Pendiente de cierre"}
          </span>
          {!existente && usuario.rol === "informatico" && (
            <button
              onClick={handleCrearCierre}
              disabled={alertas || loading}
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

      {alertas && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Existen inconsistencias en los datos. No se puede crear un nuevo
          cierre hasta que se resuelvan.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/70">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <h4 className="text-lg font-semibold text-slate-900">
                Almacenes - Ajuste de stock
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Almacén
                    </th>
                    {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                      <th
                        key={color}
                        className="px-5 py-4 text-center font-semibold capitalize"
                      >
                        {color}
                      </th>
                    ))}
                    <th className="px-5 py-4 text-center font-semibold">
                      Total
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Cajas rotas
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Tapas rotas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cierre.cierre_almacen.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No hay datos
                      </td>
                    </tr>
                  ) : (
                    cierre.cierre_almacen.map((item) => (
                      <tr
                        key={item.almacen}
                        className="border-t border-slate-100 bg-white transition hover:bg-slate-100"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {item.almacen}
                        </td>
                        {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                          <td
                            key={color}
                            className="px-5 py-4 text-center text-slate-700"
                          >
                            {item.ajuste_stock[color]}
                          </td>
                        ))}
                        <td className="px-5 py-4 text-center font-semibold text-slate-800">
                          {totalCajas(item.ajuste_stock)}
                        </td>
                        <td
                          title={CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                            const capitalize =
                              color.charAt(0).toUpperCase() + color.slice(1);
                            return `${capitalize}: ${item.roturas.cajas[color]}`;
                          }).join("\n")}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {totalCajas(item.roturas.cajas)}
                        </td>
                        <td
                          title={TAPAS_ARRAY.map((color: COLORES_TAPAS) => {
                            const capitalize =
                              color.charAt(0).toUpperCase() + color.slice(1);
                            return `${capitalize}: ${item.roturas.tapas[color]}`;
                          }).join("\n")}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {totalCajas(item.roturas.tapas)}
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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Centro
                    </th>
                    {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                      <th
                        key={color}
                        className="px-5 py-4 text-center font-semibold"
                      >
                        {color}
                      </th>
                    ))}
                    <th className="px-5 py-4 text-center font-semibold">
                      Total
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Cajas rotas
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Tapas rotas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cierre.cierre_cd.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No hay datos
                      </td>
                    </tr>
                  ) : (
                    cierre.cierre_cd.map((item) => (
                      <tr
                        key={item.centro_distribucion}
                        className="border-t border-slate-100 bg-white transition hover:bg-slate-100"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {item.centro_distribucion}
                        </td>
                        {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                          <td
                            key={color}
                            className="px-5 py-4 text-center text-slate-700"
                          >
                            {item.ajuste_deuda[color]}
                          </td>
                        ))}
                        <td className="px-5 py-4 text-center font-semibold text-slate-800">
                          {totalCajas(item.ajuste_deuda)}
                        </td>
                        <td
                          title={CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
                            const capitalize =
                              color.charAt(0).toUpperCase() + color.slice(1);
                            return `${capitalize}: ${item.roturas.cajas[color]}`;
                          }).join("\n")}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {totalCajas(item.roturas.cajas)}
                        </td>
                        <td
                          title={TAPAS_ARRAY.map((color: COLORES_TAPAS) => {
                            const capitalize =
                              color.charAt(0).toUpperCase() + color.slice(1);
                            return `${capitalize}: ${item.roturas.tapas[color]}`;
                          }).join("\n")}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {totalCajas(item.roturas.tapas)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
