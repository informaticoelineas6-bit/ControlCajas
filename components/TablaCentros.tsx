"use client";

import { useEffect, useState } from "react";
import {
  CAJAS_ARRAY,
  CentroDistribucion,
  COLORES_CAJAS,
  TAPAS_ARRAY,
  Usuario,
} from "@/lib/constants";

export default function TablaCentros({
  usuario,
}: Readonly<{ usuario: Usuario }>) {
  const [centros, setCentros] = useState<CentroDistribucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CentroDistribucion>({
    nombre: "",
    deuda: {
      blancas: 0,
      negras: 0,
      verdes: 0,
    },
    rotacion: 0,
    habilitado: { blancas: false, negras: false, verdes: false },
    roturas: {
      cajas: { blancas: 0, negras: 0, verdes: 0 },
      tapas: { blancas: 0, negras: 0 },
    },
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
      deuda: {
        blancas: 0,
        negras: 0,
        verdes: 0,
      },
      rotacion: 0,
      habilitado: { blancas: false, negras: false, verdes: false },
      roturas: {
        cajas: { blancas: 0, negras: 0, verdes: 0 },
        tapas: { blancas: 0, negras: 0 },
      },
    });
    setEditingId(null);
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const color = name.split("_").pop() as COLORES_CAJAS;
    if (type === "checkbox") {
      setForm(
        (current): CentroDistribucion => ({
          ...current,
          habilitado: { ...current.habilitado, [color]: checked },
          deuda: { ...current.deuda, [color]: 0 },
          roturas: {
            ...current.roturas,
            cajas: {
              ...current.roturas.cajas,
              [color]: 0,
            },
            tapas: {
              ...current.roturas.tapas,
              [color]: 0,
            },
          },
        }),
      );
    } else if (name.startsWith("tapas_rotas_")) {
      setForm(
        (current): CentroDistribucion => ({
          ...current,
          roturas: {
            ...current.roturas,
            cajas: {
              ...current.roturas.cajas,
            },
            tapas: {
              ...current.roturas.tapas,
              [color]: value,
            },
          },
        }),
      );
    } else if (name.startsWith("cajas_rotas_")) {
      setForm(
        (current): CentroDistribucion => ({
          ...current,
          roturas: {
            ...current.roturas,
            cajas: {
              ...current.roturas.cajas,
              [color]: value,
            },
            tapas: {
              ...current.roturas.tapas,
            },
          },
        }),
      );
    } else if (name.startsWith("deuda_")) {
      setForm(
        (current): CentroDistribucion => ({
          ...current,
          deuda: {
            ...current.deuda,
            [color]: value,
          },
        }),
      );
    } else {
      setForm((current) => ({
        ...current,
        [name]: value,
      }));
    }

    setError("");
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
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
          blancas: form.habilitado.blancas
            ? Number(form.deuda.blancas) || 0
            : 0,
          negras: form.habilitado.negras ? Number(form.deuda.negras) || 0 : 0,
          verdes: form.habilitado.verdes ? Number(form.deuda.verdes) || 0 : 0,
        },
        habilitado: {
          blancas: form.habilitado.blancas,
          negras: form.habilitado.negras,
          verdes: form.habilitado.verdes,
        },
        rotacion: Number(form.rotacion) || 0,
        roturas: {
          cajas: {
            blancas: form.habilitado.blancas
              ? Number(form.roturas.cajas.blancas) || 0
              : 0,
            negras: form.habilitado.negras
              ? Number(form.roturas.cajas.negras) || 0
              : 0,
            verdes: form.habilitado.verdes
              ? Number(form.roturas.cajas.verdes) || 0
              : 0,
          },
          tapas: {
            blancas: form.habilitado.blancas
              ? Number(form.roturas.tapas.blancas) || 0
              : 0,
            negras: form.habilitado.negras
              ? Number(form.roturas.tapas.negras) || 0
              : 0,
          },
        },
        ajuste: editingId
          ? {
              nombre: usuario.nombre,
              fechaHora: new Date().toISOString(),
              habilitado: true,
            }
          : undefined,
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
      deuda: centro.deuda,
      rotacion: centro.rotacion,
      habilitado: centro.habilitado,
      roturas: centro.roturas,
    });
    setEditingId(centro._id ?? null);
  };

  const enableCentro = async (
    target: CentroDistribucion,
    habilitado: boolean,
  ) => {
    try {
      const res = await fetch(`/api/centros?id=${target._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: target._id,
          ajuste: {
            nombre: usuario.nombre,
            fechaHora: new Date().toISOString(),
            habilitado: habilitado,
          },
        } as Partial<CentroDistribucion>),
      });
      if (res.ok) {
        fetchCentros();
      } else {
        const data = await res.json();
        setError(data.error || "Error habilitando centro");
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
                  value={form.nombre || ""}
                  disabled={!!editingId}
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

            <div className={"grid gap-4 md:grid-cols-" + CAJAS_ARRAY.length}>
              {CAJAS_ARRAY.map((color) => (
                <div key={color}>
                  <label
                    htmlFor={`deuda_${color}`}
                    className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600"
                  >
                    <input
                      id={`habilitado_${color}`}
                      name={`habilitado_${color}`}
                      type="checkbox"
                      checked={form.habilitado[color]}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    {`Deuda de cajas ${color}`}
                  </label>
                  <input
                    id={`deuda_${color}`}
                    name={`deuda_${color}`}
                    type="number"
                    value={form.deuda[color]}
                    disabled={!form.habilitado[color]}
                    onChange={handleInputChange}
                    className={numberFieldClass}
                  />
                </div>
              ))}
              {CAJAS_ARRAY.map((color) => (
                <div key={`cajas_rotas_${color}`}>
                  <label
                    htmlFor={`cajas_rotas_${color}`}
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    {`Cajas ${color} rotas`}
                  </label>
                  <input
                    id={`cajas_rotas_${color}`}
                    name={`cajas_rotas_${color}`}
                    type="number"
                    value={form.roturas.cajas[color] ?? 0}
                    disabled={!form.habilitado[color]}
                    onChange={handleInputChange}
                    className={numberFieldClass}
                  />
                </div>
              ))}
              {TAPAS_ARRAY.map((color) => (
                <div key={`tapas_rota_s${color}`}>
                  <label
                    htmlFor={`tapas_rotas_${color}`}
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    {`Tapas ${color} rotas`}
                  </label>
                  <input
                    id={`tapas_rotas_${color}`}
                    name={`tapas_rotas_${color}`}
                    type="number"
                    value={form.roturas.tapas[color] ?? 0}
                    disabled={!form.habilitado[color]}
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
        )}

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
                  <th className="px-5 py-4 text-left font-semibold">Estado</th>
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
                {centros.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {item.nombre}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.deuda.blancas ?? 0}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.deuda.negras ?? 0}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.deuda.verdes ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        {item.rotacion ?? 0} días
                      </span>
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
                      className={
                        "px-5 py-4 text-slate-500" + !!item.ajuste
                          ? " hover:bg-slate-300"
                          : ""
                      }
                    >
                      {item.ajuste?.nombre ?? "-"}
                    </td>
                    {usuario.rol === "informatico" && (
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() =>
                            enableCentro(item, !item.ajuste?.habilitado)
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
                      </td>
                    )}
                  </tr>
                ))}
                {centros.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
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
