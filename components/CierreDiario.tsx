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
} from "@/lib/constants";
import { AjusteStr, totalCajas } from "@/lib/utils";

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

  const calcularAjustesStock = useCallback(async () => {
    const ajustesMap: Record<
      string,
      { cajas: Cajas; cajas_rotas: Cajas; tapas_rotas: Cajas }
    > = {};

    const [devolucionData, expedicionData] = await Promise.all([
      (
        await fetch(
          `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.DEVOLUCION}`,
        )
      ).json() as Promise<AjusteStr<Devolucion>[]>,
      (
        await fetch(
          `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.EXPEDICION}`,
        )
      ).json() as Promise<AjusteStr<Expedicion>[]>,
    ]);

    devolucionData.forEach((item: AjusteStr<Devolucion>) => {
      if (!ajustesMap[item.almacen]) {
        ajustesMap[item.almacen] = {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
          tapas_rotas: { blancas: 0, negras: 0, verdes: 0 },
        };
      }
      ajustesMap[item.almacen].cajas.blancas += item.cajas.blancas ?? 0;
      ajustesMap[item.almacen].cajas.negras += item.cajas.negras ?? 0;
      ajustesMap[item.almacen].cajas.verdes += item.cajas.verdes ?? 0;

      ajustesMap[item.almacen].cajas_rotas.blancas +=
        item.cajas_rotas.blancas ?? 0;
      ajustesMap[item.almacen].cajas_rotas.negras +=
        item.cajas_rotas.negras ?? 0;
      ajustesMap[item.almacen].cajas_rotas.verdes +=
        item.cajas_rotas.verdes ?? 0;
      ajustesMap[item.almacen].tapas_rotas.blancas +=
        item.tapas_rotas.blancas ?? 0;
      ajustesMap[item.almacen].tapas_rotas.negras +=
        item.tapas_rotas.negras ?? 0;
    });

    expedicionData.forEach((item: AjusteStr<Expedicion>) => {
      if (!ajustesMap[item.almacen]) {
        ajustesMap[item.almacen] = {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
          tapas_rotas: { blancas: 0, negras: 0, verdes: 0 },
        };
      }
      ajustesMap[item.almacen].cajas.blancas -= item.cajas.blancas ?? 0;
      ajustesMap[item.almacen].cajas.negras -= item.cajas.negras ?? 0;
      ajustesMap[item.almacen].cajas.verdes -= item.cajas.verdes ?? 0;
    });

    return ajustesMap;
  }, [fecha]);

  const calcularAjustesDeuda = useCallback(async () => {
    const ajustesMap: Record<
      string,
      { cajas: Cajas; cajas_rotas: Cajas; tapas_rotas: Cajas }
    > = {};

    const [entregaData, recogidaData] = await Promise.all([
      (
        await fetch(
          `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.ENTREGA}`,
        )
      ).json() as Promise<AjusteStr<Entrega>[]>,
      (
        await fetch(
          `/api/eventos/list?fecha=${fecha}&tipo=${COLECCIONES.RECOGIDA}`,
        )
      ).json() as Promise<AjusteStr<Recogida>[]>,
    ]);

    entregaData.forEach((item: AjusteStr<Entrega>) => {
      if (!ajustesMap[item.centro_distribucion]) {
        ajustesMap[item.centro_distribucion] = {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
          tapas_rotas: { blancas: 0, negras: 0, verdes: 0 },
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
          cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
          tapas_rotas: { blancas: 0, negras: 0, verdes: 0 },
        };
      }

      ajustesMap[item.centro_distribucion].cajas.blancas -=
        item.cajas.blancas ?? 0;
      ajustesMap[item.centro_distribucion].cajas.negras -=
        item.cajas.negras ?? 0;
      ajustesMap[item.centro_distribucion].cajas.verdes -=
        item.cajas.verdes ?? 0;

      ajustesMap[item.centro_distribucion].cajas_rotas.blancas +=
        item.cajas_rotas.blancas ?? 0;
      ajustesMap[item.centro_distribucion].cajas_rotas.negras +=
        item.cajas_rotas.negras ?? 0;
      ajustesMap[item.centro_distribucion].cajas_rotas.verdes +=
        item.cajas_rotas.verdes ?? 0;
      ajustesMap[item.centro_distribucion].tapas_rotas.blancas +=
        item.tapas_rotas.blancas ?? 0;
      ajustesMap[item.centro_distribucion].tapas_rotas.negras +=
        item.tapas_rotas.negras ?? 0;
    });

    return ajustesMap;
  }, [fecha]);

  const nuevoCierre = useCallback(async (): Promise<Cierre> => {
    const [ajustesStock, ajustesDeuda] = await Promise.all([
      calcularAjustesStock(),
      calcularAjustesDeuda(),
    ]);

    return {
      fecha,
      cierre_cd: Object.entries(ajustesDeuda).map(([cd, data]) => ({
        centro_distribucion: cd,
        ajuste_deuda: data.cajas,
        cajas_rotas: data.cajas_rotas,
        tapas_rotas: data.tapas_rotas,
      })),
      cierre_almacen: Object.entries(ajustesStock).map(([almacen, data]) => ({
        almacen,
        ajuste_stock: data.cajas,
        cajas_rotas: data.cajas_rotas,
        tapas_rotas: data.tapas_rotas,
      })),
    };
  }, [calcularAjustesDeuda, calcularAjustesStock, fecha]);

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    setExistente(false);
    setError("");
    try {
      const respCierre = await fetch(`/api/eventos/cierre?fecha=${fecha}`);
      const dataCierre = await respCierre.json();

      if (respCierre.ok && dataCierre) {
        setCierre(dataCierre);
        setExistente(true);
      } else if (respCierre.ok) {
        const nuevo: Cierre = await nuevoCierre();
        setCierre(nuevo);
      } else {
        setError(dataCierre.error || "Error al cargar cierre");
      }
    } catch (err) {
      setError("Error al cargar datos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fecha, nuevoCierre]);

  useEffect(() => {
    fetchDatos();
    const id = setInterval(fetchDatos, 30000);
    return () => clearInterval(id);
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

      if (response.ok) {
        const nuevo = await response.json();
        setCierre(nuevo);
        setExistente(true);
        setError("");
      } else {
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
                        className="border-t border-slate-100 bg-white transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {item.almacen}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700">
                          {item.ajuste_stock.blancas}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700">
                          {item.ajuste_stock.negras}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700">
                          {item.ajuste_stock.verdes}
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-slate-800">
                          {totalCajas(item.ajuste_stock)}
                        </td>
                        <td
                          title={`Blancas: ${item.cajas_rotas.blancas}, Negras: ${item.cajas_rotas.negras}, Verdes: ${item.cajas_rotas.verdes}`}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {totalCajas(item.cajas_rotas)}
                        </td>
                        <td
                          title={`Blancas: ${item.tapas_rotas.blancas}, Negras: ${item.tapas_rotas.negras}`}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {totalCajas(item.tapas_rotas)}
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
                        className="border-t border-slate-100 bg-white transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {item.centro_distribucion}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700">
                          {item.ajuste_deuda.blancas}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700">
                          {item.ajuste_deuda.negras}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700">
                          {item.ajuste_deuda.verdes}
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-slate-800">
                          {totalCajas(item.ajuste_deuda)}
                        </td>
                        <td
                          title={`Blancas: ${item.cajas_rotas.blancas}, Negras: ${item.cajas_rotas.negras}, Verdes: ${item.cajas_rotas.verdes}`}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {totalCajas(item.cajas_rotas)}
                        </td>
                        <td
                          title={`Blancas: ${item.tapas_rotas.blancas}, Negras: ${item.tapas_rotas.negras}`}
                          className="px-5 py-4 text-center text-slate-700 hover:bg-slate-300"
                        >
                          {totalCajas(item.tapas_rotas)}
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
