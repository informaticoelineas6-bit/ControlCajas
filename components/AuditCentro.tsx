"use client";

import { useCallback, useEffect, useState } from "react";
import { CAJAS_ARRAY, CentroDistribucion, TAPAS_ARRAY } from "@/lib/constants";
import type { CentroAudit } from "@/app/api/audit/centro/route";
import { formatDate } from "@/lib/utils";

export default function AuditCentro() {
  const [nombre, setNombre] = useState("");
  const [centros, setCentros] = useState<CentroDistribucion[]>([]);
  const [datos, setDatos] = useState<CentroAudit>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    setDatos(undefined);

    try {
      const res = await fetch(`/api/audit/centro?nombre=${nombre}`);
      const data = await res.json();

      if (res.ok) {
        setDatos(data);
      } else {
        setError(data.error || "Error al cargar la auditoría");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  }, [nombre]);

  useEffect(() => {
    if (centros.some((item) => item.nombre === nombre)) {
      fetchDatos();
    }
  }, [centros, fetchDatos, nombre]);

  useEffect(() => {
    fetchCentros();
  }, []);

  const fetchCentros = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/centros");
      const data = await res.json();

      if (res.ok) {
        setCentros(data);
      } else {
        setError(data.error || "Error al cargar centros");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const getAjusteDeudaClass = (value: number) => {
    if (value > 0) return "bg-amber-50";
    if (value < 0) return "bg-emerald-50";
    return "";
  };

  const getRoturaClass = (value: number) => {
    if (value < 0) return "bg-emerald-50";
    if (value > 0) return "bg-rose-50";
    return "";
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(245,158,11,0.16),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Auditoría
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Centros
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Consulta deuda vigente, rotación, roturas y cierres por centro.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {centros.length} disponibles
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
            htmlFor="auditCentroNombre"
            className="mb-2 block text-sm font-medium text-slate-600"
          >
            Nombre
          </label>
          <select
            id="auditCentroNombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={loading || centros.length === 0}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Seleccione un centro</option>
            {centros.map((item) => (
              <option key={item.nombre} value={item.nombre}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {datos && !loading ? (
          <>
            <div className="overflow-x-auto rounded-2xl border border-amber-100">
              <table className="min-w-full text-sm">
                <thead className="bg-amber-50 text-amber-900">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Nombre
                    </th>
                    {CAJAS_ARRAY.map((color) => (
                      <th
                        key={color}
                        className="px-5 py-4 text-left font-semibold"
                      >
                        Deuda {color}
                      </th>
                    ))}
                    <th className="px-5 py-4 text-left font-semibold">
                      Rotación
                    </th>
                    {CAJAS_ARRAY.map((color) => (
                      <th
                        key={`cajas-${color}`}
                        className="px-5 py-4 text-left font-semibold"
                      >
                        Cajas rotas {color}
                      </th>
                    ))}
                    {TAPAS_ARRAY.map((color) => (
                      <th
                        key={`tapas-${color}`}
                        className="px-5 py-4 text-left font-semibold"
                      >
                        Tapas rotas {color}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-amber-100 bg-white text-slate-700">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {datos.centro.nombre}
                    </td>
                    {CAJAS_ARRAY.map((color) => (
                      <td key={`deuda-${color}`} className="px-5 py-4">
                        {datos.centro.deuda[color]}
                      </td>
                    ))}
                    <td className="px-5 py-4">{datos.centro.rotacion}</td>
                    {CAJAS_ARRAY.map((color) => (
                      <td key={`rotura-caja-${color}`} className="px-5 py-4">
                        {datos.centro.roturas.cajas[color]}
                      </td>
                    ))}
                    {TAPAS_ARRAY.map((color) => (
                      <td key={`rotura-tapa-${color}`} className="px-5 py-4">
                        {datos.centro.roturas.tapas[color]}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">Fecha</th>
                    {CAJAS_ARRAY.map((color) => (
                      <th
                        key={`ajuste-${color}`}
                        className="px-5 py-4 text-left font-semibold"
                      >
                        Ajuste deuda {color}
                      </th>
                    ))}
                    {CAJAS_ARRAY.map((color) => (
                      <th
                        key={`cierre-caja-${color}`}
                        className="px-5 py-4 text-left font-semibold"
                      >
                        Cajas rotas {color}
                      </th>
                    ))}
                    {TAPAS_ARRAY.map((color) => (
                      <th
                        key={`cierre-tapa-${color}`}
                        className="px-5 py-4 text-left font-semibold"
                      >
                        Tapas rotas {color}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.cierres.map((item) => (
                    <tr
                      key={`${item.fecha}`}
                      className="border-t border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {formatDate(item.fecha)}
                      </td>
                      {CAJAS_ARRAY.map((color) => (
                        <td
                          key={`cierre-ajuste-${item.fecha}-${color}`}
                          className={`px-5 py-4 text-slate-600 ${getAjusteDeudaClass(item.ajuste_deuda[color])}`}
                        >
                          {item.ajuste_deuda[color]}
                        </td>
                      ))}
                      {CAJAS_ARRAY.map((color) => (
                        <td
                          key={`cierre-cajas-${item.fecha}-${color}`}
                          className={`px-5 py-4 text-slate-600 ${getRoturaClass(item.cajas_rotas[color])}`}
                        >
                          {item.cajas_rotas[color]}
                        </td>
                      ))}
                      {TAPAS_ARRAY.map((color) => (
                        <td
                          key={`cierre-tapas-${item.fecha}-${color}`}
                          className={`px-5 py-4 text-slate-600 ${getRoturaClass(item.tapas_rotas[color])}`}
                        >
                          {item.tapas_rotas[color]}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {datos.cierres.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          1 + CAJAS_ARRAY.length * 2 + TAPAS_ARRAY.length
                        }
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        Este centro no tiene cierres asociados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            {loading ? "Cargando..." : "Selecciona un centro."}
          </p>
        )}
      </div>
    </section>
  );
}
