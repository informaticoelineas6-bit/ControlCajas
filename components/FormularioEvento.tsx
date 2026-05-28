"use client";

import {
  EventoResponse,
  CAJAS_ARRAY,
  CajasHabilitadas,
  Usuario,
  TIPOS_EVENTO,
  Cajas,
  Tapas,
  COLORES_CAJAS,
  CajasRoturas,
  EventoCreateForm,
  EventoAjusteForm,
} from "@/lib/constants";
import { totalCajas } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  PackageOpen,
  Truck,
  Home,
  PackageMinus,
  Undo2,
} from "lucide-react";

export type AjusteProp<Orig> = Orig & {
  id: string;
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
  const [response, setResponse] = useState<EventoResponse>({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [habilitadas, setHabilitadas] = useState<CajasHabilitadas>({
    blancas: false,
    negras: false,
    verdes: false,
  });
  const [existente, setExistente] = useState(false);

  const [formData, setFormData] = useState<EventoForm>({
    tipo_evento: tipoEvento,
    almacen: undefined,
    centro_distribucion: undefined,
    chapa: undefined,
    cajas: { blancas: 0, negras: 0, verdes: 0 },
    roturas: {
      cajas: { blancas: 0, negras: 0, verdes: 0 },
      tapas: { blancas: 0, negras: 0 },
    },
    ajuste: {
      cajas: { blancas: 0, negras: 0, verdes: 0 },
      roturas: {
        cajas: { blancas: 0, negras: 0, verdes: 0 },
        tapas: { blancas: 0, negras: 0 },
      },
    },
  });

  // populate when editing/adjustment
  useEffect(() => {
    if (initialData) {
      const initialCajas = initialData.cajas ?? {
        blancas: 0,
        negras: 0,
        verdes: 0,
      };
      const initialRoturas = initialData.roturas ?? {
        cajas: {
          blancas: 0,
          negras: 0,
          verdes: 0,
        },
        tapas: { blancas: 0, negras: 0 },
      };
      const initialAjuste = initialData.id
        ? {
            cajas: { ...initialCajas },
            roturas: {
              cajas: { ...initialRoturas.cajas },
              tapas: { ...initialRoturas.tapas },
            },
          }
        : (initialData.ajuste ?? {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            roturas: {
              cajas: { blancas: 0, negras: 0, verdes: 0 },
              tapas: { blancas: 0, negras: 0 },
            },
          });

      resetForm();
      setOriginalId(initialData.id ?? null);
      // show ajuste mode
      setTipoEvento(initialData.tipo_evento);
      setFormData({
        centro_distribucion: initialData.centro_distribucion,
        almacen: initialData.almacen,
        chapa: initialData.chapa,
        cajas: initialCajas,
        roturas: initialRoturas,
        ajuste: initialAjuste,
      });
    }
  }, [initialData]);

  const fetchDatos = useCallback(
    async (signal: AbortSignal) => {
      if (!tipoEvento) {
        return;
      }
      setLoading(true);
      setResponse({});
      try {
        const response = await fetch(`/api/form/eventos?tipo=${tipoEvento}`, {
          signal,
        });
        const data = await response.json();
        if (data.error) setMensaje(data.error);
        else setResponse(data as EventoResponse);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching data:", error);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [tipoEvento],
  );

  const fetchExistente = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/form/cierres`, {
        signal,
      });
      const data = await response.json();
      if (data.error) {
        setMensaje(data.error);
        setExistente(false);
        return false;
      }

      const cierreExistente = Boolean(data.existente);
      setExistente(cierreExistente);
      return cierreExistente;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return false;
      }
      console.error("Error fetching data:", error);
      return false;
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    fetchDatos(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [tipoEvento, fetchDatos]);

  useEffect(() => {
    if (isAdjustment) {
      return;
    }

    const abortController = new AbortController();

    fetchExistente(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [isAdjustment, fetchExistente]);

  useEffect(() => {
    if (
      formData.centro_distribucion &&
      formData.centro_distribucion in response
    ) {
      setHabilitadas(response[formData.centro_distribucion].habilitadas);
    } else {
      setHabilitadas({
        blancas: false,
        negras: false,
        verdes: false,
      });
    }
  }, [formData.centro_distribucion, response]);

  const resetForm = () => {
    setTipoEvento(undefined);
    setResponse({});
    setMensaje("");
    setSubmitted(false);
    setIsSuccess(false);
    setIsWarning(false);
    setHabilitadas({
      blancas: false,
      negras: false,
      verdes: false,
    });
    setFormData({
      almacen: undefined,
      centro_distribucion: undefined,
      chapa: undefined,
      cajas: { blancas: 0, negras: 0, verdes: 0 },
      roturas: {
        cajas: { blancas: 0, negras: 0, verdes: 0 },
        tapas: { blancas: 0, negras: 0 },
      },
      ajuste: {
        cajas: { blancas: 0, negras: 0, verdes: 0 },
        roturas: {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          tapas: { blancas: 0, negras: 0 },
        },
      },
    });
  };

  const clickReset = () => {
    if (isAdjustment && onAdjustmentSaved) {
      onAdjustmentSaved();
    }
    resetForm();
  };

  const handleSelectEvento = async (tipo: TIPOS_EVENTO) => {
    if (loading) {
      return;
    }

    if (bloqueadoPorCierre) {
      setMensaje(
        "Ya se ha realizado el cierre del día. No es posible registrar nuevas expediciones, traspasos o entregas.",
      );
      return;
    }

    setTipoEvento(tipo);
    setMensaje("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setMensaje("");
    const { name, value } = e.target;
    const numValue = Number.parseInt(value, 10);

    if (name === "centro_distribucion" && value.startsWith("Selecciona"))
      return setMensaje("Debe escoger un centro de distribución.");
    if (name === "almacen" && value.startsWith("Selecciona"))
      return setMensaje("Debe escoger un almacén.");
    if (name === "chapa" && value.startsWith("Selecciona"))
      return setMensaje("Debe escoger una chapa.");

    if (numValue < 0) {
      setMensaje("Los valores no pueden ser negativos");
      return;
    }

    // Ajuste names: ajuste_cajas_{color} | ajuste_roturas_cajas_{color} | ajuste_roturas_tapas_{color}
    if (name.startsWith("ajuste_")) {
      const parts = name.split("_");
      const color = parts.at(-1) as COLORES_CAJAS;
      const ajusteCajas = formData.ajuste.cajas;
      if (name.startsWith("ajuste_roturas_tapas_")) {
        if (numValue > ajusteCajas[color]) {
          setMensaje(
            `Las tapas ${color} rotas no pueden ser más que el total de cajas ${color}`,
          );
          return;
        }
      } else if (name.startsWith("ajuste_roturas_cajas_")) {
        if (numValue > ajusteCajas[color]) {
          setMensaje(
            `Las cajas ${color} rotas no pueden ser más que el total de cajas ${color}`,
          );
          return;
        }
      }

      setFormData((prev) => {
        const ajuste = prev.ajuste ?? {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
        };
        if (parts[1] === "cajas") {
          return {
            ...prev,
            ajuste: {
              ...ajuste,
              cajas: { ...ajuste.cajas, [color]: numValue || 0 },
            },
          };
        }
        const subKey = parts[2] as "cajas" | "tapas";
        const roturas = (ajuste as { cajas: Cajas; roturas: CajasRoturas })
          .roturas ?? {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          tapas: { blancas: 0, negras: 0 },
        };
        return {
          ...prev,
          ajuste: {
            ...ajuste,
            roturas: {
              ...roturas,
              [subKey]: { ...roturas[subKey], [color]: numValue || 0 },
            },
          },
        };
      });
      return;
    }

    const color = name.split("_").at(-1) as COLORES_CAJAS;

    if (name.startsWith("roturas_tapas_")) {
      if (numValue > formData.cajas[color]) {
        setMensaje(
          `Las tapas ${color} rotas no pueden ser más que el total de cajas ${color}`,
        );
        return;
      }
      setFormData((prev) => ({
        ...prev,
        roturas: {
          ...(prev.roturas ?? {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            tapas: { blancas: 0, negras: 0 },
          }),
          tapas: {
            ...(prev.roturas?.tapas ?? { blancas: 0, negras: 0 }),
            [color]: numValue || 0,
          },
        },
      }));
    } else if (name.startsWith("roturas_cajas_")) {
      if (numValue > formData.cajas[color]) {
        setMensaje(
          `Las cajas ${color} rotas no pueden ser más que el total de cajas ${color}`,
        );
        return;
      }
      setFormData((prev) => ({
        ...prev,
        roturas: {
          ...(prev.roturas ?? {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            tapas: { blancas: 0, negras: 0 },
          }),
          cajas: {
            ...(prev.roturas?.cajas ?? { blancas: 0, negras: 0, verdes: 0 }),
            [color]: numValue || 0,
          },
        },
      }));
    } else if (name.startsWith("cajas_")) {
      setFormData((prev) => ({
        ...prev,
        cajas: { ...prev.cajas, [color]: numValue || 0 },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!isAdjustment && bloqueadoPorCierre) {
      setMensaje(
        "Ya se ha realizado el cierre del día. No es posible registrar nuevas expediciones, traspasos o entregas.",
      );
      return;
    }

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
            roturas:
              formData.ajuste.roturas &&
              (tipoEvento === "Recogida" || tipoEvento === "Devolucion")
                ? {
                    cajas: formData.ajuste.roturas.cajas,
                    tapas: formData.ajuste.roturas.tapas,
                  }
                : undefined,
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
          centro_distribucion: formData.centro_distribucion,
          chapa: formData.chapa,
          roturas: formData.roturas
            ? {
                cajas: formData.roturas.cajas,
                tapas: formData.roturas.tapas,
              }
            : undefined,
        };
        response = await fetch(`/api/eventos/create?tipo=${tipoEvento}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const data = await response.json();

      const responseMessage = data.message ?? "";
      const mensajeLower = responseMessage.toLowerCase();
      setIsSuccess(mensajeLower.includes("exitosamente") as boolean);
      setIsWarning(mensajeLower.includes("advertencia") as boolean);

      if (response.ok) {
        setSubmitted(true);
        if (isAdjustment) {
          setMensaje(responseMessage || "Ajuste guardado exitosamente.");
        } else {
          setMensaje(responseMessage || "Evento guardado exitosamente.");
        }
      } else {
        setMensaje(data.error || "Error al procesar");
      }
    } catch (error) {
      setMensaje("Error de conexión con el servidor");
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
    if (totalCajas(formData.cajas) <= 0 && !isAdjustment)
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

  const bloqueadoPorCierre =
    existente &&
    !!tipoEvento &&
    ["Expedicion", "Traspaso", "Entrega"].includes(tipoEvento);

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
  const selectedResponse = formData.centro_distribucion
    ? response[formData.centro_distribucion]
    : undefined;

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
              {existente && (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
                  Ya se ha realizado el cierre del día. Las expediciones,
                  traspasos y entregas están deshabilitados.
                </div>
              )}
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Selecciona el tipo de evento:
              </p>
              <div
                className={
                  "grid grid-cols-1 gap-3" +
                  (usuario.rol === "chofer" ? " md:grid-cols-3" : "")
                }
              >
                {opcionesEvento.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => handleSelectEvento(tipo)}
                    disabled={
                      loading ||
                      (existente &&
                        ["Expedicion", "Traspaso", "Entrega"].includes(tipo))
                    }
                    className="w-full m-2 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(239,246,255,0.95))] px-5 py-5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_22px_38px_-24px_rgba(59,130,246,0.55)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:shadow-none"
                  >
                    <div className="mb-2 flex items-center gap-2 text-blue-500">
                      {tipo === "Expedicion" && <PackageOpen size={20} />}
                      {tipo === "Traspaso" && <Truck size={20} />}
                      {tipo === "Entrega" && <Home size={20} />}
                      {tipo === "Recogida" && <PackageMinus size={20} />}
                      {tipo === "Devolucion" && <Undo2 size={20} />}
                      <p className="text-lg font-semibold text-slate-900">
                        {tipo}
                      </p>
                    </div>
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
                    onClick={() => resetForm()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-blue-400 hover:text-slate-800"
                  >
                    <ArrowLeft size={14} />
                    Cambiar tipo de evento
                  </button>
                )}
              </div>

              <div
                className={
                  "grid gap-5 grid-cols-1 md:grid-cols-" +
                  (1 + (mostrarAlmacen ? 1 : 0) + (mostrarChapa ? 1 : 0))
                }
              >
                <div>
                  <label
                    htmlFor="centro_distribucion"
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Centro de distribución{" "}
                    {mostrarRoturas ? " o Provincia" : ""} *
                  </label>
                  <select
                    id="centro_distribucion"
                    name="centro_distribucion"
                    value={formData.centro_distribucion}
                    onChange={handleInputChange}
                    required
                    disabled={
                      !!(
                        isAdjustment ||
                        loading ||
                        bloqueadoPorCierre ||
                        submitted
                      )
                    }
                    className={fieldClass}
                  >
                    <option value={undefined}>
                      Selecciona un centro{" "}
                      {mostrarRoturas ? " o provincia" : ""}
                    </option>
                    {initialData ? (
                      <option
                        key={initialData.centro_distribucion}
                        value={initialData.centro_distribucion}
                      >
                        {initialData.centro_distribucion}
                      </option>
                    ) : (
                      Object.keys(response).map((key: string) => (
                        <option key={key} value={key}>
                          {key +
                            (mostrarRoturas
                              ? " (deuda: " +
                                (response[key].deuda_activa
                                  ? totalCajas(response[key].deuda_activa)
                                  : 0) +
                                ")"
                              : "")}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {mostrarAlmacen && formData.centro_distribucion && (
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
                        !!(
                          isAdjustment ||
                          loading ||
                          bloqueadoPorCierre ||
                          submitted
                        )
                      }
                      className={fieldClass}
                    >
                      <option value={undefined}>Selecciona un almacén</option>
                      {initialData ? (
                        <option
                          key={initialData.almacen}
                          value={initialData.almacen}
                        >
                          {initialData.almacen}
                        </option>
                      ) : (
                        selectedResponse?.almacenes?.map((almacen) => (
                          <option key={almacen} value={almacen}>
                            {almacen}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {mostrarChapa && formData.centro_distribucion && (
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
                        !!(
                          isAdjustment ||
                          loading ||
                          bloqueadoPorCierre ||
                          submitted
                        )
                      }
                      className={fieldClass}
                    >
                      <option value={undefined}>Selecciona una chapa</option>
                      {initialData ? (
                        <option
                          key={initialData.chapa}
                          value={initialData.chapa}
                        >
                          {initialData.chapa}
                        </option>
                      ) : (
                        selectedResponse?.vehiculos.map((vehiculo) => (
                          <option key={vehiculo.chapa} value={vehiculo.chapa}>
                            {vehiculo.categoria}{" "}
                            {vehiculo.marca ? vehiculo.marca + " " : ""}
                            {vehiculo.modelo ? vehiculo.modelo + " " : ""}-{" "}
                            {vehiculo.chapa}
                          </option>
                        ))
                      )}
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
                formData.roturas &&
                formCajas(
                  formData.roturas.cajas,
                  "Cajas Rotas",
                  "roturas_cajas",
                  !!(
                    isAdjustment ||
                    loading ||
                    loading ||
                    isSuccess ||
                    isWarning
                  ),
                )}

              {mostrarRoturas &&
                formData.roturas &&
                formCajas(
                  formData.roturas.tapas,
                  "Tapas Rotas",
                  "roturas_tapas",
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
                    formData.ajuste.roturas &&
                    "roturas" in formData.ajuste &&
                    formCajas(
                      formData.ajuste?.roturas.cajas || {
                        blancas: 0,
                        negras: 0,
                        verdes: 0,
                      },
                      "Ajuste Cajas Rotas",
                      "ajuste_roturas_cajas",
                      !!(loading || isSuccess || isWarning),
                    )}

                  {mostrarRoturas &&
                    formData.ajuste.roturas &&
                    "roturas" in formData.ajuste &&
                    formCajas(
                      formData.ajuste?.roturas.tapas || {
                        blancas: 0,
                        negras: 0,
                      },
                      "Ajuste Tapas Rotas",
                      "ajuste_roturas_tapas",
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
                  className="inline-flex items-center justify-center gap-2 w-full rounded-[22px] bg-[linear-gradient(135deg,_#334155,_#475569)] px-4 py-3 text-base font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <RotateCcw size={16} />
                  Regresar
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!!(loading || bloqueadoPorCierre || submitted)}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-[22px] bg-[linear-gradient(135deg,_#0f766e,_#059669)] px-4 py-3 text-base font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {!loading && <Save size={16} />}
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
    const COLOR_LABEL_STYLES: Record<COLORES_CAJAS, string> = {
      blancas: "border-slate-200 bg-white text-slate-800",
      negras: "border-slate-800 bg-slate-900 text-white",
      verdes: "border-emerald-200 bg-emerald-100 text-emerald-900",
    };

    if (Object.values(habilitadas).every((val: boolean) => !val)) return;
    return (
      <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(241,245,249,0.82))] p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
            if (!habilitadas[color] || !(color in object)) return null;
            const value = (object as Cajas)[color];
            return (
              <div
                key={color}
                className="grid grid-cols-[minmax(0,1fr)_110px] gap-3"
              >
                <label
                  htmlFor={`${prefix}_${color}`}
                  className={`flex items-center justify-center rounded-2xl border px-3 py-3 text-center font-semibold ${COLOR_LABEL_STYLES[color]}`}
                >
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </label>
                <input
                  type="number"
                  id={`${prefix}_${color}`}
                  name={`${prefix}_${color}`}
                  value={value}
                  onChange={handleInputChange}
                  disabled={
                    disabled || loading || bloqueadoPorCierre || submitted
                  }
                  className={`w-full rounded-2xl border px-3 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                    value === 0
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-400 bg-white"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
