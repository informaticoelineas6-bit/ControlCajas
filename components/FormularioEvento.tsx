"use client";

import {
  CentroDistribucion,
  CajasHabilitadas,
  Usuario,
  Vehiculo,
  Almacen,
  TIPOS_EVENTO,
  Cajas,
  Tapas,
  COLORES_CAJAS,
  Provincia,
} from "@/lib/constants";
import { totalCajas } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";

// Verificar la tardanza de el warning/message.

export interface EventoCreateForm {
  almacen?: string;
  centro_distribucion?: string;
  chapa?: string;
  cajas: Cajas;
  cajas_rotas: Cajas;
  tapas_rotas: Tapas;
}

export interface EventoAjusteForm {
  tipo_evento?: TIPOS_EVENTO;
  ajuste: {
    cajas: Cajas;
    cajas_rotas?: Cajas;
    tapas_rotas?: Tapas;
  };
}

export type AjusteProp<Orig> = Orig & {
  _id: string;
  tipo_evento: TIPOS_EVENTO;
};

export type EventoForm = EventoCreateForm & EventoAjusteForm;

interface FormularioEventoProps {
  usuario: Usuario;
  initialData?: AjusteProp<Partial<EventoForm>>; // full event document when editing
  isAdjustment?: boolean;
  onAdjustmentSaved?: () => void; // callback when adjustment is saved
}

export default function FormularioEvento({
  usuario,
  initialData,
  isAdjustment = false,
  onAdjustmentSaved,
}: Readonly<FormularioEventoProps>) {
  const [tipoEvento, setTipoEvento] = useState<TIPOS_EVENTO | undefined>(
    undefined,
  );
  const [originalId, setOriginalId] = useState<string | null>(null);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [centros, setCentros] = useState<CentroDistribucion[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [habilitado, setHabilitado] = useState<CajasHabilitadas>({
    blancas: false,
    negras: false,
    verdes: false,
  });

  const [formData, setFormData] = useState<EventoForm>({
    tipo_evento: tipoEvento,
    almacen: undefined,
    centro_distribucion: undefined,
    chapa: undefined,
    cajas: { blancas: 0, negras: 0, verdes: 0 },
    cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
    tapas_rotas: { blancas: 0, negras: 0 },
    ajuste: {
      cajas: { blancas: 0, negras: 0, verdes: 0 },
      cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
      tapas_rotas: { blancas: 0, negras: 0 },
    },
  });

  // populate when editing/adjustment
  useEffect(() => {
    if (initialData) {
      resetForm();
      setOriginalId(initialData._id ?? null);
      // show ajuste mode
      setTipoEvento(initialData.tipo_evento);
      setFormData({
        centro_distribucion: initialData.centro_distribucion,
        almacen: initialData.almacen,
        chapa: initialData.chapa,
        cajas: initialData.cajas ?? { blancas: 0, negras: 0, verdes: 0 },
        cajas_rotas: initialData.cajas_rotas ?? {
          blancas: 0,
          negras: 0,
          verdes: 0,
        },
        tapas_rotas: initialData.tapas_rotas ?? { blancas: 0, negras: 0 },
        ajuste: initialData.ajuste ?? {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
          tapas_rotas: { blancas: 0, negras: 0 },
        },
      });
    }
  }, [initialData]);

  useEffect(() => {
    setHabilitado(
      centros.find((c) => c.nombre === formData.centro_distribucion)
        ?.habilitado ?? {
        blancas: false,
        negras: false,
        verdes: false,
      },
    );
  }, [formData.centro_distribucion, centros]);

  const fetchDatos = useCallback(async () => {
    if (!tipoEvento) {
      return;
    }
    setLoading(true);
    setAlmacenes([]);
    setCentros([]);
    setVehiculos([]);
    setProvincias([]);
    try {
      const response = await fetch(`/api/formdata?tipo=${tipoEvento}`);
      const data = await response.json();
      if (data.error) setMensaje(data.error);
      if (data.almacenes) setAlmacenes(data.almacenes);
      if (data.centros) setCentros(data.centros);
      if (data.vehiculos) setVehiculos(data.vehiculos);
      if (data.provincias) setProvincias(data.provincias);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [tipoEvento]);

  useEffect(() => {
    fetchDatos();
  }, [tipoEvento, fetchDatos]);

  const resetForm = () => {
    setTipoEvento(undefined);
    setMensaje("");
    setSubmitted(false);
    setIsSuccess(false);
    setIsWarning(false);
    setFormData({
      almacen: undefined,
      centro_distribucion: undefined,
      chapa: undefined,
      cajas: { blancas: 0, negras: 0, verdes: 0 },
      cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
      tapas_rotas: { blancas: 0, negras: 0 },
      ajuste: {
        cajas: { blancas: 0, negras: 0, verdes: 0 },
        cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
        tapas_rotas: { blancas: 0, negras: 0 },
      },
    });
  };

  const clickReset = () => {
    if (isAdjustment && onAdjustmentSaved) {
      onAdjustmentSaved();
    }
    resetForm();
  };

  const handleSelectEvento = (tipo: TIPOS_EVENTO) => {
    setTipoEvento(tipo);
    setMensaje("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setMensaje("");

    const { name, value } = e.target;
    // parseInt supports negatives; fallback to 0 when NaN
    const numValue = Number.parseInt(value, 10);

    if (name === "centro_distribucion" && value.startsWith("Selecciona")) {
      setMensaje("Debe escoger un centro de distribución.");
    }
    if (name === "almacen" && value.startsWith("Selecciona")) {
      setMensaje("Debe escoger un almacén.");
    }
    if (name === "chapa" && value.startsWith("Selecciona")) {
      setMensaje("Debe escoger una chapa.");
    }

    // Ajuste fields have a prefix that includes "ajuste_" followed by the
    // category (cajas / cajas_rotas / tapas_rotas) and finally the color.
    if (name.startsWith("ajuste_")) {
      const parts = name.split("_");
      // last part is color, the rest after "ajuste" defines the category
      const color = parts.at(-1) as COLORES_CAJAS;
      const category = parts.slice(1, -1).join("_") as
        | "cajas"
        | "cajas_rotas"
        | "tapas_rotas";

      setFormData((prev) => {
        const baseAjuste = prev.ajuste ?? {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          cajas_rotas: { blancas: 0, negras: 0, verdes: 0 },
          tapas_rotas: { blancas: 0, negras: 0 },
        };
        return {
          ...prev,
          ajuste: {
            ...baseAjuste,
            [category]: {
              ...baseAjuste[category],
              [color]: numValue || 0,
            },
          },
        };
      });
      setMensaje("");
      return;
    }

    if (numValue < 0) {
      setMensaje("Los valores no pueden ser negativos");
      return;
    }

    if (name.startsWith("tapas_rotas_")) {
      const [, , color] = name.split("_");
      if (numValue > formData.cajas[color as COLORES_CAJAS]) {
        setMensaje(
          `Las tapas ${color} rotas no pueden ser más que el total de cajas ${color}`,
        );
        return;
      }
      setFormData((prev) => ({
        ...prev,
        tapas_rotas: { ...prev.tapas_rotas, [color]: numValue || 0 },
      }));
      setMensaje("");
    } else if (name.startsWith("cajas_rotas_")) {
      const [, , color] = name.split("_");
      if (numValue > formData.cajas[color as COLORES_CAJAS]) {
        setMensaje(
          `Las cajas ${color} rotas no pueden ser más que el total de cajas ${color}`,
        );
        return;
      }
      setFormData((prev) => ({
        ...prev,
        cajas_rotas: { ...prev.cajas_rotas, [color]: numValue || 0 },
      }));
      setMensaje("");
    } else if (name.startsWith("cajas_")) {
      const [, color] = name.split("_");
      setFormData((prev) => ({
        ...prev,
        cajas: { ...prev.cajas, [color]: numValue || 0 },
      }));
      setMensaje("");
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const check = checkData();
    if (!check.status) {
      setMensaje(
        "Se han detectado errores en los datos. No es posible guardar.\n" +
          check.message,
      );
      return;
    }
    setLoading(true);

    try {
      let response;
      if (isAdjustment) {
        if (!tipoEvento) {
          throw new Error(tipoEvento + " no es un tipo aceptado.");
        }
        if (!originalId) {
          throw new Error("No se tiene el id del evento.");
        }
        const body: EventoAjusteForm = {
          tipo_evento: tipoEvento,
          ajuste: {
            cajas: formData.ajuste.cajas,
            cajas_rotas: formData.ajuste.cajas_rotas,
            tapas_rotas: formData.ajuste.tapas_rotas,
          },
        };
        response = await fetch(`/api/eventos/ajuste?id=${originalId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        const body: EventoCreateForm = {
          cajas: formData.cajas,
          almacen: formData.almacen,
          cajas_rotas: formData.cajas_rotas,
          centro_distribucion: formData.centro_distribucion,
          chapa: formData.chapa,
          tapas_rotas: formData.tapas_rotas,
        };
        response = await fetch(`/api/eventos/create?tipo=${tipoEvento}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const data = await response.json();

      const mensajeLower = data.message.toLowerCase();
      setIsSuccess(mensajeLower.includes("exitosamente") as boolean);
      setIsWarning(mensajeLower.includes("advertencia") as boolean);

      if (response.ok) {
        setSubmitted(true);
        if (isAdjustment) {
          setMensaje(data.message || "Ajuste guardado exitosamente.");
        } else {
          setMensaje(data.message || "Evento guardado exitosamente.");
        }
      } else {
        setMensaje(data.error || "Error al procesar");
      }
    } catch (error) {
      setMensaje("Error en el servidor");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkData = (): { status: boolean; message: string } => {
    if (!formData.centro_distribucion) {
      return {
        status: false,
        message: "Debe escoger un centro de distribución.",
      };
    }
    switch (tipoEvento) {
      case "Expedicion":
      case "Devolucion":
        if (!formData.almacen)
          return { status: false, message: "Debe escoger un almacén." };
        break;
      case "Entrega":
      case "Recogida":
        if (!formData.chapa)
          return { status: false, message: "Debe escoger una chapa." };
        break;
      case "Traspaso":
        if (!formData.almacen)
          return { status: false, message: "Debe escoger un almacén." };
        if (!formData.chapa)
          return { status: false, message: "Debe escoger una chapa." };
        break;
      default:
        return { status: false, message: "Tipo de evento incorrecto." };
    }
    if (totalCajas(formData.cajas) <= 0)
      return { status: false, message: "La cantidad de cajas no puede ser 0." };
    return { status: true, message: "Todo listo." };
  };

  const opcionesEvento: TIPOS_EVENTO[] = (() => {
    switch (usuario.rol) {
      case "chofer":
        return ["Traspaso", "Entrega", "Recogida"];
      case "expedidor":
        return ["Expedicion"];
      case "almacenero":
        return ["Devolucion"];
      default:
        return [];
    }
  })();

  const mostrarAlmacen =
    tipoEvento === undefined
      ? false
      : ["Expedicion", "Traspaso", "Devolucion"].includes(tipoEvento);
  const mostrarChapa =
    tipoEvento === undefined
      ? false
      : ["Traspaso", "Entrega", "Recogida"].includes(tipoEvento);
  const mostrarRoturas =
    tipoEvento === undefined
      ? false
      : ["Recogida", "Devolucion"].includes(tipoEvento);
  const fieldClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
  const messageClass = () => {
    if (isWarning) return "border-amber-200 bg-amber-50 text-amber-800";
    else if (isSuccess)
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    else return "border-rose-200 bg-rose-50 text-rose-800";
  };

  return (
    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_30px_80px_-46px_rgba(15,23,42,0.38)] backdrop-blur sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            {isAdjustment ? "Ajuste manual" : "Registro operativo"}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {(isAdjustment ? "Ajustar " : "Crear ") + (tipoEvento || "evento")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {isAdjustment
              ? "Corrige los valores del movimiento original y registra el ajuste asociado al usuario actual."
              : "Selecciona el tipo de movimiento y completa los datos requeridos para registrarlo."}
          </p>
        </div>
        {/* <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          {usuario.nombre}
        </div> */}
      </div>

      {!isAdjustment && opcionesEvento.length === 0 ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          No tienes permisos para crear eventos.
        </div>
      ) : (
        <>
          {!tipoEvento && !isAdjustment ? (
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Selecciona el tipo de evento:
              </p>
              <div
                className={
                  "grid grid-cols-1 gap-3" + usuario.rol === "chofer"
                    ? " md:grid-cols-3"
                    : ""
                }
              >
                {opcionesEvento.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => handleSelectEvento(tipo)}
                    className="w-full m-2 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(239,246,255,0.95))] px-5 py-5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_22px_38px_-24px_rgba(59,130,246,0.55)]"
                  >
                    <p className="text-lg font-semibold text-slate-900">
                      {tipo}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {tipo === "Expedicion" &&
                        "Expedición desde almacén hacia un centro de distribución."}
                      {tipo === "Traspaso" &&
                        "Subida de cajas al camión antes de su transporte siguiendo una expedición."}
                      {tipo === "Entrega" &&
                        "Entrega de las cajas al centro de distribución asignado siguiendo un traspaso."}
                      {tipo === "Recogida" &&
                        "Recogida de cajas desde un centro de distribución."}
                      {tipo === "Devolucion" &&
                        "Devolución de cajas al almacén siguiendo una recogida."}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                {!isAdjustment && (
                  <button
                    type="button"
                    onClick={() => setTipoEvento(undefined)}
                    className="rounded-full bg-blue-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-blue-400 hover:text-slate-800"
                  >
                    Cambiar tipo de evento
                  </button>
                )}
              </div>

              <div
                className={
                  "grid gap-5 grid-cols-1 lg:grid-cols-" +
                  (1 + (mostrarAlmacen ? 1 : 0) + (mostrarChapa ? 1 : 0))
                }
              >
                <div>
                  <label
                    htmlFor="centro_distribucion"
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    {`Centro de distribución${mostrarRoturas ? " o Provincia" : ""} *`}
                  </label>
                  <select
                    id="centro_distribucion"
                    name="centro_distribucion"
                    value={formData.centro_distribucion}
                    onChange={handleInputChange}
                    required
                    disabled={
                      !!(isAdjustment || loading || loading || submitted)
                    }
                    className={fieldClass}
                  >
                    <option
                      value={undefined}
                    >{`Selecciona un centro${mostrarRoturas ? " o provincia" : ""}`}</option>
                    {centros.map((centro) => (
                      <option key={centro._id} value={centro.nombre}>
                        {centro.nombre +
                          (tipoEvento === "Recogida"
                            ? " (deuda: " +
                              (centro.deuda.blancas +
                                centro.deuda.negras +
                                centro.deuda.verdes) +
                              ")"
                            : "")}
                      </option>
                    ))}
                    {mostrarRoturas &&
                      provincias.map((provincia) => (
                        <option key={provincia._id} value={provincia.nombre}>
                          {provincia.nombre}
                        </option>
                      ))}
                  </select>
                </div>
                {mostrarAlmacen && (
                  <div>
                    <label
                      htmlFor="almacen"
                      className="mb-2 block text-sm font-medium text-slate-600"
                    >
                      Almacén *
                    </label>
                    <select
                      id="almacen"
                      name="almacen"
                      value={formData.almacen}
                      onChange={handleInputChange}
                      required
                      disabled={
                        !!(isAdjustment || loading || loading || submitted)
                      }
                      className={fieldClass}
                    >
                      <option value={undefined}>Selecciona un almacén</option>
                      {almacenes.map((almacen) => (
                        <option key={almacen._id} value={almacen.nombre}>
                          {almacen.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {mostrarChapa && (
                  <div>
                    <label
                      htmlFor="chapa"
                      className="mb-2 block text-sm font-medium text-slate-600"
                    >
                      Chapa *
                    </label>
                    <select
                      id="chapa"
                      name="chapa"
                      value={formData.chapa}
                      onChange={handleInputChange}
                      required
                      disabled={
                        !!(isAdjustment || loading || loading || submitted)
                      }
                      className={fieldClass}
                    >
                      <option value={undefined}>Selecciona una chapa</option>
                      {vehiculos.map((vehiculo) => (
                        <option key={vehiculo._id} value={vehiculo.chapa}>
                          {vehiculo.categoria}{" "}
                          {vehiculo.marca ? vehiculo.marca + " " : ""}
                          {vehiculo.modelo ? vehiculo.modelo + " " : ""}-{" "}
                          {vehiculo.chapa}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {formCajas(
                formData.cajas,
                "Total de Cajas",
                "cajas",
                !!(
                  isAdjustment ||
                  loading ||
                  loading ||
                  isSuccess ||
                  isWarning
                ),
              )}

              {mostrarRoturas &&
                formCajas(
                  formData.cajas_rotas,
                  "Cajas Rotas",
                  "cajas_rotas",
                  !!(
                    isAdjustment ||
                    loading ||
                    loading ||
                    isSuccess ||
                    isWarning
                  ),
                )}

              {mostrarRoturas &&
                formCajas(
                  formData.tapas_rotas,
                  "Tapas Rotas",
                  "tapas_rotas",
                  !!(
                    isAdjustment ||
                    loading ||
                    loading ||
                    isSuccess ||
                    isWarning
                  ),
                )}

              {isAdjustment && (
                <div>
                  {formCajas(
                    formData.ajuste?.cajas || {
                      blancas: 0,
                      negras: 0,
                      verdes: 0,
                    },
                    "Ajuste Total de Cajas",
                    "ajuste_cajas",
                    !!(loading || isSuccess || isWarning),
                  )}

                  {mostrarRoturas &&
                    "cajas_rotas" in formData.ajuste &&
                    formCajas(
                      formData.ajuste?.cajas_rotas || {
                        blancas: 0,
                        negras: 0,
                        verdes: 0,
                      },
                      "Ajuste Cajas Rotas",
                      "ajuste_cajas_rotas",
                      !!(loading || isSuccess || isWarning),
                    )}

                  {mostrarRoturas &&
                    "tapas_rotas" in formData.ajuste &&
                    formCajas(
                      formData.ajuste?.tapas_rotas || {
                        blancas: 0,
                        negras: 0,
                      },
                      "Ajuste Tapas Rotas",
                      "ajuste_tapas_rotas",
                      !!(loading || isSuccess || isWarning),
                    )}
                </div>
              )}

              {mensaje && (
                <div
                  className={`whitespace-pre-line rounded-[22px] border px-4 py-3 text-sm font-medium ${
                    messageClass
                  }`}
                >
                  {mensaje}
                </div>
              )}

              {submitted ? (
                <button
                  type="button"
                  onClick={clickReset}
                  className="w-full rounded-[22px] bg-[linear-gradient(135deg,_#334155,_#475569)] px-4 py-3 text-base font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Regresar
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!!(loading || submitted)}
                  className="w-full rounded-[22px] bg-[linear-gradient(135deg,_#0f766e,_#059669)] px-4 py-3 text-base font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading
                    ? "Cargando..."
                    : "Guardar" + (isAdjustment ? " Ajuste" : "")}
                </button>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );

  function formCajas(
    object: Cajas | Tapas,
    title: string,
    prefix: string,
    disabled = false,
  ) {
    if (!habilitado.blancas && !habilitado.negras && !habilitado.verdes) return;
    return (
      <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(241,245,249,0.82))] p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {habilitado.blancas && (
            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
              <label
                htmlFor={`${prefix}_blancas`}
                className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center font-semibold text-slate-800"
              >
                Blancas
              </label>
              <input
                type="number"
                id={`${prefix}_blancas`}
                name={`${prefix}_blancas`}
                value={object.blancas}
                onChange={handleInputChange}
                disabled={disabled || submitted}
                className={`w-full rounded-2xl border px-3 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                  object.blancas === 0
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-400 bg-white"
                }`}
              />
            </div>
          )}
          {habilitado.negras && (
            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
              <label
                htmlFor={`${prefix}_negras`}
                className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-3 py-3 text-center font-semibold text-white"
              >
                Negras
              </label>
              <input
                type="number"
                id={`${prefix}_negras`}
                name={`${prefix}_negras`}
                value={object.negras}
                onChange={handleInputChange}
                disabled={disabled || submitted}
                className={`w-full rounded-2xl border px-3 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                  object.negras === 0
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-400 bg-white"
                }`}
              />
            </div>
          )}
          {habilitado.verdes && "verdes" in object && (
            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
              <label
                htmlFor={`${prefix}_verdes`}
                className="flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 px-3 py-3 text-center font-semibold text-emerald-900"
              >
                Verdes
              </label>
              <input
                type="number"
                id={`${prefix}_verdes`}
                name={`${prefix}_verdes`}
                value={object.verdes}
                onChange={handleInputChange}
                disabled={disabled || submitted}
                className={`w-full rounded-2xl border px-3 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                  object.verdes === 0
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-400 bg-white"
                }`}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}
