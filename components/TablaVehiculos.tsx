"use client";

import { useEffect, useState } from "react";
import { Usuario, Vehiculo } from "@/lib/constants";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import { ObjetoAjusteForm } from "@/app/api/admin/ajuste/route";

export default function TablaVehiculos({
  usuario,
}: Readonly<{ usuario: Usuario }>) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<Vehiculo>>({
    chapa: "",
    marca: "",
    modelo: "",
    categoria: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vehiculos");
      const data = await res.json();
      if (res.ok) {
        setVehiculos(data);
      } else {
        setError(data.error || "Error al cargar vehículos");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ chapa: "", marca: "", modelo: "", categoria: "" });
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
    if (!form.chapa || !form.categoria) {
      setError("Chapa y categoría son requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body: Vehiculo = {
        categoria: form.categoria,
        chapa: form.chapa,
        marca: form.marca!,
        modelo: form.modelo!,
        ajuste: editingId
          ? {
              fechaHora: new Date().toISOString(),
              habilitado: true,
              nombre: usuario.nombre,
            }
          : undefined,
      };
      const res = await fetch("/api/admin/vehiculos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        resetForm();
        fetchVehiculos();
      } else {
        setError(data.error || "Error en la operación");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (vehiculo: Vehiculo) => {
    setForm(vehiculo);
    setEditingId(vehiculo.chapa ?? null);
  };

  const enableVehiculo = async (target: Vehiculo, habilitado: boolean) => {
    try {
      const res = await fetch(`/api/admin/ajuste?id=${target.chapa}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_objeto: "Vehiculo",
          ajuste: {
            nombre: usuario.nombre,
            fechaHora: new Date().toISOString(),
            habilitado: habilitado,
          },
        } as ObjetoAjusteForm),
      });
      if (res.ok) {
        fetchVehiculos();
      } else {
        const data = await res.json();
        setError(data.error || "Error habilitando vehículo");
      }
    } catch {
      setError("Error en el servidor");
    }
  };

  const handleDelete = async (vehiculo: Vehiculo) => {
    if (!vehiculo.chapa) return;

    setDeletingId(vehiculo.chapa);
    setError("");
    try {
      const res = await fetch(`/api/admin/vehiculos?id=${vehiculo.chapa}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        if (editingId === vehiculo.chapa) resetForm();
        fetchVehiculos();
      } else {
        setError(data.error || "Error al eliminar vehículo");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(59,130,246,0.08),_rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Flota
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Vehículos
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Gestiona categoría, chapa y datos base de la flota operativa.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            {vehiculos.length} registrados
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
                  htmlFor="categoria"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Categoría
                </label>
                <input
                  id="categoria"
                  name="categoria"
                  required
                  value={form.categoria || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div>
                <label
                  htmlFor="chapa"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Chapa
                </label>
                <input
                  id="chapa"
                  name="chapa"
                  required
                  value={form.chapa || ""}
                  disabled={!!editingId}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div>
                <label
                  htmlFor="marca"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Marca
                </label>
                <input
                  id="marca"
                  name="marca"
                  value={form.marca || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div>
                <label
                  htmlFor="modelo"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Modelo
                </label>
                <input
                  id="modelo"
                  name="modelo"
                  value={form.modelo || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(37,99,235,0.9)] transition hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ? "Guardar cambios" : "Agregar vehículo"}
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
              {vehiculos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No hay vehículos registrados
                </div>
              ) : (
                vehiculos.map((item) => (
                  <article
                    key={item.chapa}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Chapa
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-slate-900">
                          {item.chapa ?? "-"}
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
                              enableVehiculo(item, !item.ajuste?.habilitado)
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
                            entityName={`el centro ${item.chapa}`}
                            disabled={deletingId === item.chapa}
                            buttonLabel={
                              deletingId === item.chapa
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
                        <p className="text-slate-500">Categoría</p>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                          {item.categoria ?? "-"}
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-500">Marca</p>
                        <p className="font-medium text-slate-700">
                          {item.marca ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Modelo</p>
                        <p className="font-medium text-slate-700">
                          {item.modelo ?? "-"}
                        </p>
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
                        <p className="text-slate-500">Editado por</p>
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
                      Categoría
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">Chapa</th>
                    <th className="px-5 py-4 text-left font-semibold">Marca</th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Modelo
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Estado
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Editado por
                    </th>
                    {usuario.rol === "informatico" && (
                      <th className="px-5 py-4 text-center font-semibold">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map((item) => (
                    <tr
                      key={item.chapa}
                      className="border-t border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                          {item.categoria ?? "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {item.chapa ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {item.marca ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {item.modelo ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
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
                              onClick={() => startEdit(item)}
                              className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() =>
                                enableVehiculo(item, !item.ajuste?.habilitado)
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
                              entityName={`el ${item.categoria} ${item.chapa}`}
                              disabled={deletingId === item.chapa}
                              buttonLabel={
                                deletingId === item.chapa
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
                  {vehiculos.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No hay vehículos registrados
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
