"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AuditLog,
  CAJAS_ARRAY,
  COLORES_CAJAS,
  COLORES_TAPAS,
  TAPAS_ARRAY,
  Usuario,
} from "@/lib/constants";
import type { EventoAudit, UsuarioAudit } from "@/app/api/audit/usuario/route";
import { formatDate } from "@/lib/utils";

export default function AuditUsuario() {
  const [nombre, setNombre] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [datos, setDatos] = useState<UsuarioAudit>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    setDatos(undefined);

    try {
      const res = await fetch(`/api/audit/usuario?nombre=${nombre}`);
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
    if (usuarios.some((item) => item.nombre === nombre)) {
      fetchDatos();
    }
  }, [fetchDatos, nombre, usuarios]);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/form/usuarios");
      const data = await res.json();

      if (res.ok) {
        setUsuarios(data);
      } else {
        setError(data.error || "Error al cargar usuarios");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const getCajasClass = (value: number) => {
    if (value > 0) return "bg-blue-50";
    return "";
  };

  const getRoturaClass = (value?: number) => {
    if (!value) return "";
    if (value < 0) return "bg-emerald-200";
    if (value > 0) return "bg-rose-200";
    return "";
  };

  const eventos: EventoAudit[] = datos?.eventos ?? [];
  const logs: AuditLog[] = datos?.logs ?? [];

  const getActionClass = (action: "DELETE" | "UPDATE" | "INSERT") => {
    switch (action) {
      case "DELETE":
        return "text-rose-700 bg-rose-50 ring-rose-200";
      case "INSERT":
        return "text-emerald-700 bg-emerald-50 ring-emerald-200";
      case "UPDATE":
        return "text-amber-700 bg-amber-50 ring-amber-200";
      default:
        return "";
    }
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(59,130,246,0.14),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Auditoría
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Usuarios
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Analiza actividad por usuario y su distribución de movimientos.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {usuarios.length} disponibles
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
            htmlFor="auditUsuarioNombre"
            className="mb-2 block text-sm font-medium text-slate-600"
          >
            Nombre
          </label>
          <select
            id="auditUsuarioNombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={loading || usuarios.length === 0}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Selecciona un usuario</option>
            {usuarios.map((item) => (
              <option key={item.nombre} value={item.nombre}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {datos && !loading ? (
          <>
            <div className="overflow-x-auto rounded-2xl border border-blue-100">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-50 text-blue-900">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Nombre
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">Rol</th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Fecha inscripción
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Estado
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Ajustado por
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Fecha ajuste
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-blue-100 bg-white text-slate-700">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {datos.usuario.nombre}
                    </td>
                    <td className="px-5 py-4 capitalize">
                      {datos.usuario.rol}
                    </td>
                    <td className="px-5 py-4">
                      {datos.usuario.created_at
                        ? formatDate(datos.usuario.created_at)
                        : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          datos.usuario.ajuste?.habilitado
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-rose-200"
                        }`}
                      >
                        {datos.usuario.ajuste?.habilitado
                          ? "Habilitado"
                          : "Deshabilitado"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {datos.usuario.ajuste?.nombre ?? "-"}
                    </td>
                    <td className="px-5 py-4">
                      {datos.usuario.ajuste?.fechaHora
                        ? formatDate(datos.usuario.ajuste.fechaHora)
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {datos.usuario.rol === "informatico" ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold">
                        Fecha
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        Tipo
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        Acción
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        Objeto
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        (Cambios)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((item, index) => (
                      <tr
                        key={`${item.object_type}-${item.action}-${index}`}
                        className="border-t border-slate-100 transition hover:bg-slate-100"
                      >
                        <td className="px-5 py-4 font-medium text-slate-700">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.object_type}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <span
                            className={
                              "rounded-full px-3 py-1 text-xs font-semibold ring-1 " +
                              getActionClass(item.action)
                            }
                          >
                            {item.action}
                          </span>
                        </td>
                        {item.changes && (
                          <td className="px-5 py-4 text-slate-600">
                            <pre className="max-w-lg overflow-x-auto whitespace-pre-wrap break-all text-xs text-slate-600">
                              {JSON.stringify(item.changes.prev, null, 2)}
                            </pre>
                          </td>
                        )}
                        <td
                          colSpan={item.changes ? 1 : 2}
                          className="px-5 py-4 text-slate-600"
                        >
                          <pre className="max-w-lg overflow-x-auto whitespace-pre-wrap break-all text-xs text-slate-600">
                            {JSON.stringify(
                              item.changes?.new ?? item.snapshot,
                              null,
                              2,
                            )}
                          </pre>
                        </td>
                      </tr>
                    ))}

                    {logs.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-10 text-center text-slate-500"
                        >
                          Este usuario no tiene ediciones registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold">
                        Fecha
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        Centro
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        Evento
                      </th>
                      {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                        <th
                          key={`cajas-${color}`}
                          className="px-5 py-4 text-left font-semibold"
                        >
                          Cajas {color}
                        </th>
                      ))}
                      {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                        <th
                          key={`rotas-${color}`}
                          className="px-5 py-4 text-left font-semibold"
                        >
                          Cajas rotas {color}
                        </th>
                      ))}
                      {TAPAS_ARRAY.map((color: COLORES_TAPAS) => (
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
                    {eventos.map((item, index) => (
                      <tr
                        key={`${item.fecha}-${item.tipo_evento}-${item.centro_distribucion}-${index}`}
                        className="border-t border-slate-100 transition hover:bg-slate-100"
                      >
                        <td className="px-5 py-4 font-medium text-slate-700">
                          {formatDate(item.fecha)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.centro_distribucion}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                            {item.tipo_evento}
                          </span>
                        </td>
                        {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                          <td
                            key={`cajas-${item.fecha}-${color}`}
                            className={`px-5 py-4 text-slate-600 ${getCajasClass(item.cajas[color])}`}
                          >
                            {item.cajas[color]}
                          </td>
                        ))}
                        {CAJAS_ARRAY.map((color: COLORES_CAJAS) => (
                          <td
                            key={`cajas-rotas-${item.fecha}-${color}`}
                            className={`px-5 py-4 text-slate-600 ${getRoturaClass(item.roturas?.cajas[color])}`}
                          >
                            {item.roturas?.cajas[color]}
                          </td>
                        ))}
                        {TAPAS_ARRAY.map((color: COLORES_TAPAS) => (
                          <td
                            key={`tapas-rotas-${item.fecha}-${color}`}
                            className={`px-5 py-4 text-slate-600 ${getRoturaClass(item.roturas?.tapas[color])}`}
                          >
                            {item.roturas?.tapas[color]}
                          </td>
                        ))}
                      </tr>
                    ))}

                    {eventos.length === 0 && (
                      <tr>
                        <td
                          colSpan={
                            3 + CAJAS_ARRAY.length * 2 + TAPAS_ARRAY.length
                          }
                          className="px-5 py-10 text-center text-slate-500"
                        >
                          Este usuario no tiene eventos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">
            {loading ? "Cargando..." : "Selecciona un usuario."}
          </p>
        )}
      </div>
    </section>
  );
}
