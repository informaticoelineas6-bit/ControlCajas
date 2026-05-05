"use client";

import { useState } from "react";
import { useUser } from "@/app/(app)/user-context";
import { contentCardClass, pageAccess } from "../tabs";
import {
  ItemComparacionEntrega,
  ItemComparacionRecogida,
} from "@/lib/constants";
import TablaExpedicionEntrega from "@/components/TablaExpedicionEntrega";
import TablaRecogidaDevolucion from "@/components/TablaRecogidaDevolucion";
import CierreDiario from "@/components/CierreDiario";
import NotAllowed from "@/app/not-allowed";

export default function CierreEventos() {
  const usuario = useUser();
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [expedicionEntregaData, setExpedicionEntregaData] = useState<
    ItemComparacionEntrega[]
  >([]);
  const [recogidaDevolucionData, setRecogidaDevolucionData] = useState<
    ItemComparacionRecogida[]
  >([]);

  if (!usuario) return null;

  if (!pageAccess[usuario.rol].includes("cierre_eventos")) {
    return NotAllowed();
  }

  return (
    <div className={contentCardClass}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Comparación
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">
            Cuadre entre eventos
          </h3>
        </div>
        <div>
          <label
            htmlFor="fechaRenderCruce"
            className="mb-2 block text-sm font-medium text-slate-600"
          >
            Fecha
          </label>
          <input
            id="fechaRenderCruce"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>
      <div className="space-y-8">
        <TablaExpedicionEntrega
          fecha={fecha}
          datos={expedicionEntregaData}
          setDatos={setExpedicionEntregaData}
        />
        <TablaRecogidaDevolucion
          fecha={fecha}
          datos={recogidaDevolucionData}
          setDatos={setRecogidaDevolucionData}
        />
        <CierreDiario
          fecha={fecha}
          usuario={usuario}
          expedicionEntregaData={expedicionEntregaData}
          recogidaDevolucionData={recogidaDevolucionData}
        />
      </div>
    </div>
  );
}
