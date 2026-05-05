"use client";

import { useState } from "react";
import { useUser } from "@/app/(app)/user-context";
import { pageAccess, contentCardClass } from "../tabs";
import { Evento, TIPOS_EVENTO } from "@/lib/constants";
import { AjusteProp } from "@/components/FormularioEvento";
import FormularioEvento from "@/components/FormularioEvento";
import TablaExpedicion from "@/components/TablaExpedicion";
import TablaTraspaso from "@/components/TablaTraspaso";
import TablaEntrega from "@/components/TablaEntrega";
import TablaRecogida from "@/components/TablaRecogida";
import TablaDevolucion from "@/components/TablaDevolucion";
import { X } from "lucide-react";
import NotAllowed from "@/app/not-allowed";

export default function MisEventos() {
  const usuario = useUser();
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [adjustingEvent, setAdjustingEvent] =
    useState<AjusteProp<Evento> | null>(null);

  if (!usuario) return null;

  if (!pageAccess[usuario.rol].includes("mis_eventos")) {
    return NotAllowed();
  }

  const handleAjustarClick = async (
    tipoEvento: TIPOS_EVENTO,
    eventoId: number,
  ) => {
    try {
      const res = await fetch(
        `/api/eventos/get?tipo=${tipoEvento}&id=${eventoId}`,
      );
      const evento: AjusteProp<Evento> = await res.json();
      if (res.ok) {
        setAdjustingEvent({ ...evento, tipo_evento: tipoEvento });
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  return (
    <>
      <div className={contentCardClass}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Filtro principal
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Movimientos por fecha
            </h3>
          </div>
          <div>
            <label
              htmlFor="fechaRender"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Fecha
            </label>
            <input
              id="fechaRender"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="space-y-8">
          {(usuario.rol === "informatico" || usuario.rol === "expedidor") && (
            <TablaExpedicion
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
          {(usuario.rol === "informatico" || usuario.rol === "chofer") && (
            <TablaTraspaso
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
          {(usuario.rol === "informatico" || usuario.rol === "chofer") && (
            <TablaEntrega
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
          {(usuario.rol === "informatico" || usuario.rol === "chofer") && (
            <TablaRecogida
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
          {(usuario.rol === "informatico" || usuario.rol === "almacenero") && (
            <TablaDevolucion
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
        </div>
      </div>

      {adjustingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-white/60 bg-white shadow-[0_30px_80px_-38px_rgba(15,23,42,0.7)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                  Ajuste manual
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Ajustar evento
                </h2>
              </div>
              <button
                onClick={() => setAdjustingEvent(null)}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={14} />
                Cerrar
              </button>
            </div>
            <div className="p-6">
              <FormularioEvento
                usuario={usuario}
                initialData={adjustingEvent}
                isAdjustment={true}
                onAdjustmentSaved={() => setAdjustingEvent(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
