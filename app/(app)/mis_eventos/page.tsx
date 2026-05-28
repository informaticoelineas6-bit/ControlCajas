"use client";

import { useState } from "react";
import { useUser } from "@/app/(app)/user-context";
import { useFecha } from "@/app/(app)/fecha-context";
import { pageAccess, contentCardClass, PageTabItem } from "../tabs";
import SelectorFecha from "@/components/SelectorFecha";
import { EventoCreateForm, ROLES, TIPOS_EVENTO } from "@/lib/constants";
import FormularioEvento, { AjusteProp } from "@/components/FormularioEvento";
import TablaExpedicion from "@/components/TablaExpedicion";
import TablaTraspaso from "@/components/TablaTraspaso";
import TablaEntrega from "@/components/TablaEntrega";
import TablaRecogida from "@/components/TablaRecogida";
import TablaDevolucion from "@/components/TablaDevolucion";
import FormModal from "@/components/AdminFormModal";
import { List, MapPin, Plus, Truck, Warehouse, Wrench } from "lucide-react";
import NotAllowed from "@/app/not-allowed";
import PageTabs from "@/components/PageTabs";

const userAccess: Record<ROLES, TIPOS_EVENTO[]> = {
  almacenero: ["Devolucion"],
  chofer: ["Traspaso", "Entrega", "Recogida"],
  expedidor: ["Expedicion"],
  informatico: ["Expedicion", "Traspaso", "Entrega", "Recogida", "Devolucion"],
  auditor: [],
};

const userTabs: Record<ROLES, PageTabItem[]> = {
  expedidor: [
    {
      icon: <Plus size={15} />,
      key: "Expedicion",
      name: "Expediciones",
    },
  ],
  chofer: [
    {
      icon: <List size={15} />,
      key: "Traspaso",
      name: "Traspasos",
    },
    {
      icon: <MapPin size={15} />,
      key: "Entrega",
      name: "Entregas",
    },
    {
      icon: <Warehouse size={15} />,
      key: "Recogida",
      name: "Recogidas",
    },
  ],
  almacenero: [
    {
      icon: <Truck size={15} />,
      key: "Devolucion",
      name: "Devoluciones",
    },
  ],
  informatico: [
    {
      icon: <Plus size={15} />,
      key: "Expedicion",
      name: "Expediciones",
    },
    {
      icon: <List size={15} />,
      key: "Traspaso",
      name: "Traspasos",
    },
    {
      icon: <MapPin size={15} />,
      key: "Entrega",
      name: "Entregas",
    },
    {
      icon: <Warehouse size={15} />,
      key: "Recogida",
      name: "Recogidas",
    },
    {
      icon: <Truck size={15} />,
      key: "Devolucion",
      name: "Devoluciones",
    },
  ],
  auditor: [],
};

export default function MisEventos() {
  const usuario = useUser();
  const { fecha } = useFecha();
  const [activeContent, setActiveContent] = useState<string>(
    () => userAccess[usuario?.rol as ROLES]?.[0],
  );
  const [adjustingEvent, setAdjustingEvent] =
    useState<AjusteProp<EventoCreateForm> | null>(null);

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
      const evento: AjusteProp<EventoCreateForm> = await res.json();
      if (res.ok) {
        setAdjustingEvent({ ...evento, tipo_evento: tipoEvento });
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  const RenderContent = (content: TIPOS_EVENTO) => {
    switch (content) {
      case "Traspaso":
        return (
          <TablaTraspaso
            usuario={usuario}
            fecha={fecha}
            onAjustar={handleAjustarClick}
          />
        );
      case "Entrega":
        return (
          <TablaEntrega
            usuario={usuario}
            fecha={fecha}
            onAjustar={handleAjustarClick}
          />
        );
      case "Recogida":
        return (
          <TablaRecogida
            usuario={usuario}
            fecha={fecha}
            onAjustar={handleAjustarClick}
          />
        );
      case "Devolucion":
        return (
          <TablaDevolucion
            usuario={usuario}
            fecha={fecha}
            onAjustar={handleAjustarClick}
          />
        );
      case "Expedicion":
      default:
        return (
          <TablaExpedicion
            usuario={usuario}
            fecha={fecha}
            onAjustar={handleAjustarClick}
          />
        );
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
          <SelectorFecha />
        </div>
        <PageTabs
          items={userTabs[usuario.rol] || []}
          activeKey={activeContent}
          onSelect={setActiveContent}
        />
        {RenderContent(activeContent as TIPOS_EVENTO)}
      </div>

      <FormModal
        description="Corrige los valores del movimiento original y registra el ajuste."
        headerClassName="bg-[linear-gradient(135deg,_rgba(245,158,11,0.08),_rgba(255,255,255,0.96))]"
        icon={<Wrench size={18} className="text-amber-600" />}
        isOpen={!!adjustingEvent}
        onDismiss={() => setAdjustingEvent(null)}
        title="Ajustar evento"
      >
        {adjustingEvent && (
          <FormularioEvento
            usuario={usuario}
            initialData={adjustingEvent}
            isAdjustment={true}
            onAdjustmentSaved={() => setAdjustingEvent(null)}
          />
        )}
      </FormModal>
    </>
  );
}
