"use client";

import { useEffect, useState } from "react";
import { Almacen, Usuario } from "@/lib/constants";

export default function TablaAlmacenes({
  usuario,
}: Readonly<{ usuario: Usuario }>) {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<any>>({
    nombre: "",
    stock_blancas: 0,
    stock_negras: 0,
    stock_verdes: 0,
    habilitado_blancas: true,
    habilitado_negras: true,
    habilitado_verdes: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAlmacenes();
  }, []);

  const fetchAlmacenes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/almacenes");
      const data = await res.json();
      if (res.ok) {
        setAlmacenes(data);
      } else {
        setError(data.error || "Error al cargar almacenes");
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
      stock_blancas: 0,
      stock_negras: 0,
      stock_verdes: 0,
      habilitado_blancas: true,
      habilitado_negras: true,
      habilitado_verdes: true,
    });
    setEditingId(null);
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      const fieldName = name.replace("habilitado_", "stock_");
      setForm((current) => ({
        ...current,
        [name]: checked,
        [fieldName]: 0,
      }));
    } else {
      setForm((current) => ({
        ...current,
        [name]: value,
      }));
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre) {
      setError("Nombre es requerido");
      return;
    }

    setSubmitting(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body: Almacen = {
        _id: editingId || undefined,
        nombre: form.nombre,
        stock: {
          blancas: form.habilitado_blancas
            ? Number(form.stock_blancas) || 0
            : 0,
          negras: form.habilitado_negras ? Number(form.stock_negras) || 0 : 0,
          verdes: form.habilitado_verdes ? Number(form.stock_verdes) || 0 : 0,
        },
        habilitado: {
          blancas: form.habilitado_blancas,
          negras: form.habilitado_negras,
          verdes: form.habilitado_verdes,
        },
        ajuste: editingId ? usuario.nombre : undefined,
      };
      const res = await fetch("/api/almacenes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        resetForm();
        fetchAlmacenes();
      } else {
        setError(data.error || "Error en la operación");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (almacen: Almacen) => {
    setForm({
      nombre: almacen.nombre,
      stock_blancas: almacen.stock?.blancas || 0,
      stock_negras: almacen.stock?.negras || 0,
      stock_verdes: almacen.stock?.verdes || 0,
      habilitado_blancas: almacen.habilitado?.blancas ?? true,
      habilitado_negras: almacen.habilitado?.negras ?? true,
      habilitado_verdes: almacen.habilitado?.verdes ?? true,
    });
    setEditingId(almacen._id ?? null);
  };

  const handleDelete = async (almacen: Almacen) => {
    if (!confirm("¿Eliminar el almacén " + almacen.nombre + "?")) return;
    try {
      const res = await fetch(`/api/almacenes?id=${almacen._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAlmacenes();
      } else {
        const data = await res.json();
        setError(data.error || "Error eliminando");
      }
    } catch {
      setError("Error en el servidor");
    }
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(16,185,129,0.08),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Inventario base
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Almacenes
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Configura stock inicial y colores habilitados para cada almacén.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {almacenes.length} registrados
          </span>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

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
                value={form.nombre || ""}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            {[
              ["blancas", "Stock blancas"],
              ["negras", "Stock negras"],
              ["verdes", "Stock verdes"],
            ].map(([color, label]) => (
              <div key={color}>
                <label
                  htmlFor={`stock_${color}`}
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600"
                >
                  <input
                    id={`habilitado_${color}`}
                    name={`habilitado_${color}`}
                    type="checkbox"
                    checked={form[`habilitado_${color}`]}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {label}
                </label>
                <input
                  id={`stock_${color}`}
                  name={`stock_${color}`}
                  type="number"
                  value={form[`stock_${color}`]}
                  disabled={!form[`habilitado_${color}`]}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(5,150,105,0.9)] transition hover:from-emerald-500 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingId ? "Guardar cambios" : "Agregar almacén"}
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

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Cargando...</p>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">Nombre</th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Blancas
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">Negras</th>
                  <th className="px-5 py-4 text-left font-semibold">Verdes</th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Editado por
                  </th>
                  <th className="px-5 py-4 text-center font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {almacenes.map((almacen) => (
                  <tr
                    key={almacen._id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {almacen.nombre}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {almacen.stock.blancas ?? 0}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {almacen.stock.negras ?? 0}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {almacen.stock.verdes ?? 0}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {almacen.ajuste || "-"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => startEdit(almacen)}
                        className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(almacen)}
                        className="ml-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {almacenes.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No hay almacenes registrados
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
