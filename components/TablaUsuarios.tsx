"use client";

import { useEffect, useState } from "react";
import { ROLES_ARRAY, TABLAS, Usuario } from "@/lib/constants";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import { ObjetoAjusteForm } from "@/app/api/admin/ajuste/route";
import { frontendClient } from "@/lib/client";

export default function TablaUsuarios({
  usuario,
}: Readonly<{ usuario: Usuario }>) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Usuario>({
    nombre: "",
    rol: "chofer",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetchUsuarios(abortController.signal);

    const channel = frontendClient
      .channel(`${TABLAS.USUARIO}_changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.USUARIO },
        () => {
          fetchUsuarios(abortController.signal);
        },
      )
      .subscribe();

    return () => {
      abortController.abort();
      channel.unsubscribe();
    };
  }, []);

  const fetchUsuarios = async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/usuarios", { signal });
      const data = await res.json();
      if (res.ok) {
        setUsuarios(data);
      } else {
        setError(data.error || "Error al cargar usuarios");
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
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      rol: "chofer",
    });
    setEditingId(null);
    setError("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      if (!editingId) {
        setError(
          "Ha ocurrido un error extraño. Has intentado modificar un usuario?",
        );
        return;
      }
      const method = "PUT";
      const body: Usuario = {
        nombre: editingId,
        rol: form.rol,
        ajuste: {
          nombre: usuario.nombre,
          fechaHora: new Date().toISOString(),
          habilitado: form.ajuste?.habilitado ?? false,
        },
      };
      const res = await fetch("/api/admin/usuarios", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        resetForm();
      } else {
        setError(data.error || "Error en la operación");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (usuario: Usuario) => {
    setForm(usuario);
    setEditingId(usuario.nombre ?? null);
  };

  const enableUsuario = async (target: Usuario, habilitado: boolean) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/ajuste?id=${target.nombre}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_objeto: "Usuario",
          ajuste: {
            nombre: usuario.nombre,
            fechaHora: new Date().toISOString(),
            habilitado: habilitado,
          },
        } as ObjetoAjusteForm),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error habilitando usuario");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (target: Usuario) => {
    if (!target.nombre) return;

    setDeletingId(target.nombre);
    setError("");
    try {
      const res = await fetch(`/api/admin/usuarios?id=${target.nombre}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        if (editingId === target.nombre) resetForm();
      } else {
        setError(data.error || "Error al eliminar usuario");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setDeletingId(null);
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

        {usuario.rol === "informatico" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="nombre"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  disabled
                  value={form.nombre || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div>
                <label
                  htmlFor="rol"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Rol
                </label>
                <select
                  id="rol"
                  name="rol"
                  required
                  value={form.rol}
                  disabled={!editingId}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  {ROLES_ARRAY.map((rol) => (
                    <option key={rol} value={rol}>
                      {rol.charAt(0).toUpperCase() + rol.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting || !editingId}
                className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(37,99,235,0.9)] transition hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {"Guardar"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Cargando...</p>
        ) : (
          <>
            <div className="space-y-3 mt-8 lg:hidden">
              {usuarios.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No hay usuarios registrados
                </div>
              ) : (
                usuarios.map((item) => (
                  <article
                    key={item.nombre}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Nombre
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-slate-900">
                          {item.nombre ?? "-"}
                        </h4>
                      </div>
                      {usuario.rol === "informatico" && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() =>
                              enableUsuario(item, !item.ajuste?.habilitado)
                            }
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              item.ajuste?.habilitado
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {item.ajuste?.habilitado
                              ? "Deshabilitar"
                              : "Habilitar"}
                          </button>
                          <ConfirmDeleteButton
                            entityName={`el centro ${item.nombre}`}
                            disabled={deletingId === item.nombre}
                            buttonLabel={
                              deletingId === item.nombre
                                ? "Eliminando..."
                                : undefined
                            }
                            onConfirm={() => handleDelete(item)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Rol</p>
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700 ring-1 ring-violet-200">
                          {item.rol ?? "-"}
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-500">Estado</p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            item.ajuste?.habilitado
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-rose-50 text-rose-700 ring-rose-200"
                          }`}
                        >
                          {item.ajuste?.habilitado
                            ? "Habilitado"
                            : "Deshabilitado"}
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-500">Autorizado por</p>
                        <p className="font-medium text-slate-700">
                          {item.ajuste?.nombre ?? "-"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="mt-8 overflow-x-auto hidden lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Nombre
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">Rol</th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Estado
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Autorizado por
                    </th>
                    {usuario.rol === "informatico" && (
                      <th className="px-5 py-4 text-center font-semibold">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((item) => (
                    <tr
                      key={item.nombre}
                      className="border-t border-slate-100 transition hover:bg-slate-100"
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
                            item.ajuste?.habilitado
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-rose-50 text-rose-700 ring-rose-200"
                          }`}
                        >
                          {item.ajuste?.habilitado
                            ? "Habilitado"
                            : "Deshabilitado"}
                        </span>
                      </td>
                      <td
                        title={
                          item.ajuste
                            ? "Ajustado el " +
                              new Date(item.ajuste?.fechaHora).toLocaleString(
                                "es-MX",
                                {
                                  dateStyle: "full",
                                  timeStyle: "short",
                                },
                              )
                            : undefined
                        }
                        className="px-5 py-4 text-slate-500 hover:bg-slate-300"
                      >
                        {item.ajuste?.nombre ?? "-"}
                      </td>
                      {usuario.rol === "informatico" && (
                        <td className="px-5 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              disabled={submitting}
                              onClick={() =>
                                enableUsuario(item, !item.ajuste?.habilitado)
                              }
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                item.ajuste?.habilitado
                                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {item.ajuste?.habilitado
                                ? "Deshabilitar"
                                : "Habilitar"}
                            </button>
                            <button
                              onClick={() => startEdit(item)}
                              className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                            >
                              Editar
                            </button>
                            <ConfirmDeleteButton
                              entityName={`el usuario ${item.nombre}`}
                              disabled={deletingId === item.nombre}
                              buttonLabel={
                                deletingId === item.nombre
                                  ? "Eliminando..."
                                  : undefined
                              }
                              onConfirm={() => handleDelete(item)}
                            />
                          </div>
                        </td>
                      )}
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
          </>
        )}
      </div>
    </section>
  );
}
