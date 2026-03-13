"use client";

import { useEffect, useState } from "react";
import { Usuario } from "@/lib/constants";

export default function TablaUsuarios({
  usuario,
}: Readonly<{ usuario: Usuario }>) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios");
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

  const enableUsuario = async (target: Usuario, habilitado: boolean) => {
    try {
      const res = await fetch(`/api/usuarios?id=${target._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: target._id,
          habilitado,
          ajuste: usuario.nombre,
        }),
      });
      if (res.ok) {
        fetchUsuarios();
      } else {
        const data = await res.json();
        setError(data.error || "Error habilitando usuario");
      }
    } catch {
      setError("Error en el servidor");
    }
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(168,85,247,0.08),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Acceso
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Usuarios
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Controla roles y estado de acceso del personal del sistema.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {usuarios.length} usuarios
          </span>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-2 text-sm text-slate-500">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">Nombre</th>
                  <th className="px-5 py-4 text-left font-semibold">Rol</th>
                  <th className="px-5 py-4 text-left font-semibold">Estado</th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Autorizado por
                  </th>
                  <th className="px-5 py-4 text-center font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {item.nombre ?? "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700 ring-1 ring-violet-200">
                        {item.rol ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          item.habilitado
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-rose-200"
                        }`}
                      >
                        {item.habilitado ? "Habilitado" : "Deshabilitado"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {item.ajuste || "-"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => enableUsuario(item, !item.habilitado)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          item.habilitado
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {item.habilitado ? "Deshabilitar" : "Habilitar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
