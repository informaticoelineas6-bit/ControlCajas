"use client";

import { colorStyles } from "@/app/(app)/layout";
import { useCallback, useEffect, useState } from "react";
import {
  Almacen,
  CAJAS_ARRAY,
  COLORES_CAJAS,
  COLORES_TAPAS,
  TAPAS_ARRAY,
} from "@/lib/constants";
import type { AlmacenAudit } from "@/lib/constants";
import { formatDate, formatNumber, prettyName } from "@/lib/utils";

const defaultAlmacenAudit: AlmacenAudit = {
  almacen: {
    nombre: "Ninguno seleccionado",
    stock: {
      blancas: 0,
      negras: 0,
      verdes: 0,
    },
    roturas: {
      cajas: {
        blancas: 0,
        negras: 0,
        verdes: 0,
      },
      tapas: {
        blancas: 0,
        negras: 0,
      },
    },
    habilitadas: {
      blancas: false,
      negras: false,
      verdes: false,
    },
    habilitado: false,
    ajuste: "-",
  },
  cierres: [],
};

export default function AuditAlmacen() {
  const [nombre, setNombre] = useState("");
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [datos, setDatos] = useState<AlmacenAudit>(defaultAlmacenAudit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDatos = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");
      setDatos(defaultAlmacenAudit);

      try {
        const res = await fetch(`/api/audit/almacen?nombre=${nombre}`, {
          signal,
        });
        const data = await res.json();

        if (res.ok) {
          setDatos(data);
        } else {
          setError(data.error || "Error al cargar la auditoría");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setError("Error de conexión con el servidor");
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [nombre],
  );

  useEffect(() => {
    const abortController = new AbortController();

    if (almacenes.some((item) => item.nombre === nombre)) {
      fetchDatos(abortController.signal);
    }

    return () => {
      abortController.abort();
    };
  }, [almacenes, fetchDatos, nombre]);

  useEffect(() => {
    const abortController = new AbortController();

    fetchAlmacenes(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, []);

  const fetchAlmacenes = async (signal: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/form/almacenes", { signal });
      const data = await res.json();

      if (res.ok) {
        setAlmacenes(data);
      } else {
        setError(data.error || "Error al cargar almacenes");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setError("Error de conexión con el servidor");
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const getAjusteStockClass = (value: number) => {
    if (value > 0) return "ring-2 ring-emerald-400";
    if (value < 0) return "ring-2 ring-rose-400";
    return "";
  };

  const getRoturaClass = (value: number) => {
    if (value < 0) return "ring-2 ring-emerald-400";
    if (value > 0) return "ring-2 ring-rose-400";
    return "";
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(16,185,129,0.14),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Auditoría
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Almacenes
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Revisa stock actual, roturas y cierres históricos por almacén.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {loading ? "Cargando..." : `${almacenes.length} disponibles`}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="auditAlmacenNombre"
            className="mb-2 block text-sm font-medium text-slate-600"
          >
            Nombre
          </label>
          <select
            id="auditAlmacenNombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={loading || almacenes.length === 0}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Seleccione un almacén</option>
            {almacenes.map((item) => (
              <option key={item.nombre} value={item.nombre}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 lg:hidden">
          <article
            key={datos.almacen.nombre}
            className="rounded-2xl text-center border border-emerald-100 bg-emerald-50 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-800">
                  Nombre
                </p>
                <h4 className="mt-1 text-base font-semibold text-slate-900">
                  {datos.almacen.nombre ?? "-"}
                </h4>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                <div key={color} className={colorStyles[color].bg}>
                  <p className="text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      {colorStyles[color].icon}
                      Stock {color}
                    </span>
                  </p>
                  <p className="stock-number font-medium text-slate-700">
                    {formatNumber(datos.almacen.stock?.[color], "-")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                <div key={color} className={colorStyles[color].bg}>
                  <p className="text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      {colorStyles[color].icon}
                      Cajas {color} rotas
                    </span>
                  </p>
                  <p className="stock-number font-medium text-slate-700">
                    {formatNumber(datos.almacen.roturas.cajas[color], "-")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {TAPAS_ARRAY.map((color: COLORES_TAPAS) => (
                <div key={color} className={colorStyles[color].bg}>
                  <p className="text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      {colorStyles[color].icon}
                      Tapas {color} rotas
                    </span>
                  </p>
                  <p className="stock-number font-medium text-slate-700">
                    {formatNumber(datos.almacen.roturas.tapas[color], "-")}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-slate-600">Estado</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    datos.almacen.habilitado
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-rose-50 text-rose-700 ring-rose-200"
                  }`}
                >
                  {datos.almacen.habilitado ? "Habilitado" : "Deshabilitado"}
                </span>
              </div>
              <div>
                <p className="text-slate-600">Editado por</p>
                <p className="font-medium text-slate-700">
                  {datos.almacen.ajuste
                    ? prettyName(datos.almacen.ajuste)
                    : "-"}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-emerald-100 hidden lg:block">
          <table className="min-w-full text-sm text-center">
            <thead className="bg-emerald-50 text-emerald-800">
              <tr>
                <th className="px-5 py-4 font-semibold">Nombre</th>
                {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                  <th
                    key={color}
                    className={
                      "px-5 py-4 font-semibold" + colorStyles[color].bg
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {colorStyles[color].icon}
                      Stock {color}
                    </span>
                  </th>
                ))}
                {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                  <th
                    key={`cajas-${color}`}
                    className={
                      "px-5 py-4 font-semibold" + colorStyles[color].bg
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {colorStyles[color].icon}
                      Cajas rotas {color}
                    </span>
                  </th>
                ))}
                {TAPAS_ARRAY.map((color: COLORES_TAPAS) => (
                  <th
                    key={`tapas-${color}`}
                    className={
                      "px-5 py-4 font-semibold" + colorStyles[color].bg
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {colorStyles[color].icon}
                      Tapas rotas {color}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-emerald-100 bg-white text-slate-700">
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {datos.almacen.nombre}
                </td>
                {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                  <td
                    key={`stock-${color}`}
                    className={"stock-number px-5 py-4" + colorStyles[color].bg}
                  >
                    {formatNumber(datos.almacen.stock[color], "-")}
                  </td>
                ))}
                {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                  <td
                    key={`rotura-caja-${color}`}
                    className={"stock-number px-5 py-4" + colorStyles[color].bg}
                  >
                    {formatNumber(datos.almacen.roturas.cajas[color], "-")}
                  </td>
                ))}
                {TAPAS_ARRAY.map((color: COLORES_TAPAS) => (
                  <td
                    key={`rotura-tapa-${color}`}
                    className={"stock-number px-5 py-4" + colorStyles[color].bg}
                  >
                    {formatNumber(datos.almacen.roturas.tapas[color], "-")}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-3 mt-8 lg:hidden">
          {datos.cierres.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              {loading
                ? "Cargando..."
                : "No hay cierres asociados a este almacén."}
            </div>
          ) : (
            datos.cierres.map((item) => (
              <article
                key={item.fecha}
                className="rounded-[24px] text-center border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-800">
                      Fecha del cierre
                    </p>
                    <h4 className="mt-1 text-base font-semibold text-slate-900">
                      {item.fecha ?? "-"}
                    </h4>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                    <div key={color} className={colorStyles[color].bg}>
                      <p className="text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          {colorStyles[color].icon}
                          Ajuste stock {color}
                        </span>
                      </p>
                      <p className="stock-number font-medium text-slate-700">
                        {formatNumber(item.ajuste_stock[color], "-")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
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
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
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
                </div>
              </article>
            ))
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 hidden lg:block">
          <table className="min-w-full text-sm text-center">
            <thead className="bg-slate-50 text-slate-800">
              <tr>
                <th className="px-5 py-4 font-semibold">Fecha</th>
                {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                  <th
                    key={`ajuste-${color}`}
                    className={
                      "px-5 py-4 font-semibold" + colorStyles[color].bg
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {colorStyles[color].icon}
                      Ajuste stock {color}
                    </span>
                  </th>
                ))}
                {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                  <th
                    key={`cierre-caja-${color}`}
                    className={
                      "px-5 py-4 font-semibold" + colorStyles[color].bg
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {colorStyles[color].icon}
                      Cajas rotas {color}
                    </span>
                  </th>
                ))}
                {TAPAS_ARRAY.map((color: COLORES_TAPAS) => (
                  <th
                    key={`cierre-tapa-${color}`}
                    className={
                      "px-5 py-4 font-semibold" + colorStyles[color].bg
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {colorStyles[color].icon}
                      Tapas rotas {color}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {datos.cierres.map((item) => (
                <tr
                  key={`${item.fecha}`}
                  className="border-t border-slate-100 transition hover:bg-slate-100"
                >
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {item.fecha ? formatDate(item.fecha) : "-"}
                  </td>
                  {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                    <td
                      key={`cierre-ajuste-${item.fecha}-${color}`}
                      className={
                        "px-5 py-4 text-slate-600" + colorStyles[color].bg
                      }
                    >
                      <span
                        className={`stock-number inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${getAjusteStockClass(item.ajuste_stock[color])}`}
                      >
                        {formatNumber(item.ajuste_stock[color], "-")}
                      </span>
                    </td>
                  ))}
                  {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                    <td
                      key={`cierre-cajas-${item.fecha}-${color}`}
                      className={
                        "px-5 py-4 text-slate-600" + colorStyles[color].bg
                      }
                    >
                      <span
                        className={`stock-number inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${getRoturaClass(item.roturas.cajas[color])}`}
                      >
                        {formatNumber(item.roturas.cajas[color], "-")}
                      </span>
                    </td>
                  ))}
                  {TAPAS_ARRAY.map((color: COLORES_TAPAS) => (
                    <td
                      key={`cierre-tapas-${item.fecha}-${color}`}
                      className={
                        "px-5 py-4 text-slate-600" + colorStyles[color].bg
                      }
                    >
                      <span
                        className={`stock-number inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${getRoturaClass(item.roturas.tapas[color])}`}
                      >
                        {formatNumber(item.roturas.tapas[color], "-")}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}

              {datos.cierres.length === 0 && (
                <tr>
                  <td
                    colSpan={1 + CAJAS_ARRAY.length * 2 + TAPAS_ARRAY.length}
                    className="px-5 py-10 text-slate-500"
                  >
                    {loading
                      ? "Cargando..."
                      : "Este almacén no tiene cierres asociados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
