"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/(app)/user-context";
import { useFecha } from "@/app/(app)/fecha-context";
import { pageAccess, contentCardClass } from "../tabs";
import SelectorFecha from "@/components/SelectorFecha";
import { Evento, ROLES, TIPOS_EVENTO } from "@/lib/constants";
import { AjusteProp } from "@/components/FormularioEvento";
import FormularioEvento from "@/components/FormularioEvento";
import TablaExpedicion from "@/components/TablaExpedicion";
import TablaTraspaso from "@/components/TablaTraspaso";
import TablaEntrega from "@/components/TablaEntrega";
import TablaRecogida from "@/components/TablaRecogida";
import TablaDevolucion from "@/components/TablaDevolucion";
import { List, MapPin, Plus, Truck, Warehouse, X } from "lucide-react";
import NotAllowed from "@/app/not-allowed";
import {
  type SidebarSubmenuItem,
  useSidebarSubmenu,
} from "../sidebar-submenu-context";

const userAccess: Record<ROLES, TIPOS_EVENTO[]> = {
  almacenero: ["Devolucion"],
  chofer: ["Traspaso", "Entrega", "Recogida"],
  expedidor: ["Expedicion"],
  informatico: ["Expedicion", "Traspaso", "Entrega", "Recogida", "Devolucion"],
  auditor: [],
};

const userTabs: Record<ROLES, SidebarSubmenuItem[]> = {
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
  const { clearSubmenu, setSubmenu } = useSidebarSubmenu();
  const [activeContent, setActiveContent] = useState<string>(
    () => userAccess[usuario?.rol as ROLES]?.[0],
  );
  const [adjustingEvent, setAdjustingEvent] =
    useState<AjusteProp<Evento> | null>(null);

  useEffect(() => {
    if (!usuario) return;

    const items: SidebarSubmenuItem[] = userTabs[usuario.rol] || [];

    setSubmenu({
      activeKey: activeContent,
      items,
      onSelect: setActiveContent,
      route: "/mis_eventos",
    });

    return clearSubmenu;
  }, [activeContent, clearSubmenu, setSubmenu, usuario]);

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
        {RenderContent(activeContent as TIPOS_EVENTO)}
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
