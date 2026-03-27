"use client";

import { useEffect, useState } from "react";
import { CentroDistribucion, Provincia, Usuario } from "@/lib/constants";
import ConfirmDeleteButton from "./ConfirmDeleteButton";

export default function TablaProvincias({
  usuario,
}: Readonly<{ usuario: Usuario }>) {
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [centros, setCentros] = useState<CentroDistribucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Provincia>({
    nombre: "",
    centro_distribucion: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProvincias();
    fetchCentros();
  }, []);

  const fetchProvincias = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/provincias");
      const data = await res.json();
      if (res.ok) {
        setProvincias(data);
      } else {
        setError(data.error || "Error al cargar provincias");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const fetchCentros = async () => {
    setLoading(true);
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

  const resetForm = () => {
    setForm({
      nombre: "",
      centro_distribucion: "",
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
    if (!form.nombre || !form.centro_distribucion) {
      setError("Nombre y Centro de distribución son requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body: Provincia = {
        _id: editingId || undefined,
        nombre: form.nombre,
        centro_distribucion: form.centro_distribucion,
        ajuste: editingId
          ? {
              nombre: usuario.nombre,
              fechaHora: new Date().toISOString(),
            }
          : undefined,
      };
      const res = await fetch("/api/provincias", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        resetForm();
        fetchProvincias();
      } else {
        setError(data.error || "Error en la operación");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (provincia: Provincia) => {
    setForm(provincia);
    setEditingId(provincia._id ?? null);
  };

  const handleDelete = async (provincia: Provincia) => {
    if (!provincia._id) return;

    setDeletingId(provincia._id);
    setError("");
    try {
      const res = await fetch(`/api/provincias?id=${provincia._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        if (editingId === provincia._id) resetForm();
        fetchProvincias();
      } else {
        setError(data.error || "Error al eliminar provincia");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(99,102,241,0.12),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Asignación
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Provincias
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Asocia qué centro de distribución reparte a cada provincia.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {provincias.length} provincias
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
                  required
                  disabled={!!editingId}
                  value={form.nombre || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label
                  htmlFor="centro_distribucion"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Centro de distribución
                </label>
                <select
                  id="centro_distribucion"
                  name="centro_distribucion"
                  required
                  value={form.centro_distribucion}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  {centros.map((centro) => (
                    <option key={centro.nombre} value={centro.nombre}>
                      {centro.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(79,70,229,0.9)] transition hover:from-indigo-500 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ? "Guardar cambios" : "Agregar provincia"}
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
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">Nombre</th>
                  <th className="px-5 py-4 text-left font-semibold">Centro</th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Ajustado por
                  </th>
                  {usuario.rol === "informatico" && (
                    <th className="px-5 py-4 text-center font-semibold">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {provincias.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {item.nombre ?? "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700 ring-1 ring-indigo-200">
                        {item.centro_distribucion ?? "-"}
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
                          onClick={() => startEdit(item)}
                          className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                        >
                          Editar
                        </button>
                        <ConfirmDeleteButton
                          entityName={`la provincia ${item.nombre}`}
                          disabled={deletingId === item._id}
                          buttonLabel={
                            deletingId === item._id ? "Eliminando..." : undefined
                          }
                          onConfirm={() => handleDelete(item)}
                        />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {provincias.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No hay provincias registradas
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
