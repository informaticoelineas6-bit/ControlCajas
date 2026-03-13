"use client";

import { useEffect, useState } from "react";
import { CentroDistribucion, Usuario } from "@/lib/constants";

export default function TablaCentros({
  usuario,
}: Readonly<{ usuario: Usuario }>) {
  const [centros, setCentros] = useState<CentroDistribucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<any>>({
    nombre: "",
    deuda_blancas: 0,
    deuda_negras: 0,
    deuda_verdes: 0,
    rotacion: 0,
    habilitado_blancas: false,
    habilitado_negras: false,
    habilitado_verdes: false,
    roturas_cajas_blancas: 0,
    roturas_cajas_negras: 0,
    roturas_cajas_verdes: 0,
    roturas_tapas_blancas: 0,
    roturas_tapas_negras: 0,
    roturas_tapas_verdes: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const numberFieldClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

  useEffect(() => {
    fetchCentros();
  }, []);

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
      deuda_blancas: 0,
      deuda_negras: 0,
      deuda_verdes: 0,
      rotacion: 0,
      habilitado_blancas: false,
      habilitado_negras: false,
      habilitado_verdes: false,
      roturas_cajas_blancas: 0,
      roturas_cajas_negras: 0,
      roturas_cajas_verdes: 0,
      roturas_tapas_blancas: 0,
      roturas_tapas_negras: 0,
      roturas_tapas_verdes: 0,
    });
    setEditingId(null);
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      const color = name.replace("habilitado_", "");
      setForm((current) => ({
        ...current,
        [name]: checked,
        [`deuda_${color}`]: 0,
        [`roturas_cajas_${color}`]: 0,
        [`roturas_tapas_${color}`]: 0,
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
      const body: CentroDistribucion = {
        _id: editingId || undefined,
        nombre: form.nombre,
        deuda: {
          blancas: form.habilitado_blancas
            ? Number(form.deuda_blancas) || 0
            : 0,
          negras: form.habilitado_negras ? Number(form.deuda_negras) || 0 : 0,
          verdes: form.habilitado_verdes ? Number(form.deuda_verdes) || 0 : 0,
        },
        habilitado: {
          blancas: form.habilitado_blancas,
          negras: form.habilitado_negras,
          verdes: form.habilitado_verdes,
        },
        rotacion: Number(form.rotacion) || 0,
        roturas: {
          cajas: {
            blancas: form.habilitado_blancas
              ? Number(form.roturas_cajas_blancas) || 0
              : 0,
            negras: form.habilitado_negras
              ? Number(form.roturas_cajas_negras) || 0
              : 0,
            verdes: form.habilitado_verdes
              ? Number(form.roturas_cajas_verdes) || 0
              : 0,
          },
          tapas: {
            blancas: form.habilitado_blancas
              ? Number(form.roturas_tapas_blancas) || 0
              : 0,
            negras: form.habilitado_negras
              ? Number(form.roturas_tapas_negras) || 0
              : 0,
            verdes: form.habilitado_verdes
              ? Number(form.roturas_tapas_verdes) || 0
              : 0,
          },
        },
        ajuste: editingId ? usuario.nombre : undefined,
      };
      const res = await fetch("/api/centros", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        resetForm();
        fetchCentros();
      } else {
        setError(data.error || "Error en la operación");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (centro: CentroDistribucion) => {
    setForm({
      nombre: centro.nombre,
      deuda_blancas: centro.deuda?.blancas || 0,
      deuda_negras: centro.deuda?.negras || 0,
      deuda_verdes: centro.deuda?.verdes || 0,
      rotacion: centro.rotacion || 0,
      habilitado_blancas: centro.habilitado?.blancas ?? false,
      habilitado_negras: centro.habilitado?.negras ?? false,
      habilitado_verdes: centro.habilitado?.verdes ?? false,
      roturas_cajas_blancas: centro.roturas?.cajas?.blancas || 0,
      roturas_cajas_negras: centro.roturas?.cajas?.negras || 0,
      roturas_cajas_verdes: centro.roturas?.cajas?.verdes || 0,
      roturas_tapas_blancas: centro.roturas?.tapas?.blancas || 0,
      roturas_tapas_negras: centro.roturas?.tapas?.negras || 0,
      roturas_tapas_verdes: centro.roturas?.tapas?.verdes || 0,
    });
    setEditingId(centro._id ?? null);
  };

  const handleDelete = async (centro: CentroDistribucion) => {
    if (!confirm("¿Eliminar el centro " + centro.nombre + "?")) return;
    try {
      const res = await fetch(`/api/centros?id=${centro._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCentros();
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
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(245,158,11,0.08),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Red operativa
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Centros de distribución
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Define deuda inicial, colores habilitados y rotación objetivo.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {centros.length} registrados
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
                className={numberFieldClass}
              />
            </div>
            <div>
              <label
                htmlFor="rotacion"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Rotación (días)
              </label>
              <input
                id="rotacion"
                name="rotacion"
                type="number"
                value={form.rotacion || 0}
                onChange={handleInputChange}
                className={numberFieldClass}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["blancas", "Deuda blancas"],
              ["negras", "Deuda negras"],
              ["verdes", "Deuda verdes"],
            ].map(([color, label]) => (
              <div key={color}>
                <label
                  htmlFor={`deuda_${color}`}
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600"
                >
                  <input
                    id={`habilitado_${color}`}
                    name={`habilitado_${color}`}
                    type="checkbox"
                    checked={form[`habilitado_${color}`]}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  {label}
                </label>
                <input
                  id={`deuda_${color}`}
                  name={`deuda_${color}`}
                  type="number"
                  value={form[`deuda_${color}`]}
                  disabled={!form[`habilitado_${color}`]}
                  onChange={handleInputChange}
                  className={numberFieldClass}
                />
              </div>
            ))}
            {[
              ["blancas", "Roturas de cajas blancas", "roturas_cajas"],
              ["negras", "Roturas de cajas negras", "roturas_cajas"],
              ["verdes", "Roturas de cajas verdes", "roturas_cajas"],
              ["blancas", "Roturas de tapas blancas", "roturas_tapas"],
              ["negras", "Roturas de tapas negras", "roturas_tapas"],
              ["verdes", "Roturas de tapas verdes", "roturas_tapas"],
            ].map(([color, label, prefix]) => (
              <div key={`${prefix}_${color}`}>
                <label
                  htmlFor={`${prefix}_${color}`}
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  {label}
                </label>
                <input
                  id={`${prefix}_${color}`}
                  name={`${prefix}_${color}`}
                  type="number"
                  value={form[`${prefix}_${color}`] ?? 0}
                  disabled={!form[`habilitado_${color}`]}
                  onChange={handleInputChange}
                  className={numberFieldClass}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gradient-to-r from-amber-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(217,119,6,0.9)] transition hover:from-amber-500 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingId ? "Guardar cambios" : "Agregar centro"}
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
                  <th className="px-5 py-4 text-left font-semibold">Blancas</th>
                  <th className="px-5 py-4 text-left font-semibold">Negras</th>
                  <th className="px-5 py-4 text-left font-semibold">Verdes</th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Rotación
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Editado por
                  </th>
                  <th className="px-5 py-4 text-center font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {centros.map((centro) => (
                  <tr
                    key={centro._id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {centro.nombre}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {centro.deuda.blancas ?? 0}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {centro.deuda.negras ?? 0}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {centro.deuda.verdes ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        {centro.rotacion ?? 0} días
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {centro.ajuste || "-"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => startEdit(centro)}
                        className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(centro)}
                        className="ml-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {centros.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No hay centros registrados
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
