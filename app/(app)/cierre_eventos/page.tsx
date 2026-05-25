"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/app/(app)/user-context";
import { useFecha } from "@/app/(app)/fecha-context";
import { contentCardClass, pageAccess } from "../tabs";
import SelectorFecha from "@/components/SelectorFecha";
import {
  ItemComparacionEntrega,
  ItemComparacionRecogida,
} from "@/lib/compares";
import TablaExpedicionEntrega from "@/components/TablaExpedicionEntrega";
import TablaRecogidaDevolucion from "@/components/TablaRecogidaDevolucion";
import CierreDiario from "@/components/CierreDiario";
import NotAllowed from "@/app/not-allowed";
import {
  type SidebarSubmenuItem,
  useSidebarSubmenu,
} from "../sidebar-submenu-context";
import {
  ArrowRightLeft,
  ClipboardCheck,
  GitCompareArrows,
  LayoutGrid,
} from "lucide-react";
import { frontendClient } from "@/lib/client";
import { TABLAS } from "@/lib/constants";

export default function CierreEventos() {
  const usuario = useUser();
  const { fecha } = useFecha();
  const { clearSubmenu, setSubmenu } = useSidebarSubmenu();
  const [activeContent, setActiveContent] = useState<string>(() => "cierre");
  const [expedicionEntregaData, setExpedicionEntregaData] = useState<
    ItemComparacionEntrega[]
  >([]);
  const [recogidaDevolucionData, setRecogidaDevolucionData] = useState<
    ItemComparacionRecogida[]
  >([]);
  const [parentLoading, setParentLoading] = useState(true);
  const [parentError, setParentError] = useState("");
  const [cierreExistente, setCierreExistente] = useState(false);

  const fetchDatos = useCallback(
    async (signal: AbortSignal) => {
      setParentLoading(true);
      setCierreExistente(false);
      setParentError("");
      try {
        const respCierre = await fetch(`/api/form/cierres?fecha=${fecha}`, {
          signal,
        });
        const dataCierre = await respCierre.json();

        if (respCierre.ok) {
          console.log(dataCierre);
          setCierreExistente(dataCierre.existente);
        } else {
          setParentError(dataCierre.error || "Error al cargar cierre");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setParentError("Error al cargar datos");
        console.error(error);
      } finally {
        if (!signal.aborted) {
          setParentLoading(false);
        }
      }
    },
    [fecha],
  );

  useEffect(() => {
    const abortController = new AbortController();

    fetchDatos(abortController.signal);

    const channel = frontendClient
      .channel("cierre_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLAS.CIERRE },
        () => {
          fetchDatos(abortController.signal);
        },
      )
      .subscribe();

    return () => {
      abortController.abort();
      channel.unsubscribe();
    };
  }, [fetchDatos]);

  useEffect(() => {
    if (!usuario) return;

    setSubmenu({
      activeKey: activeContent,
      items: [
        {
          icon: <GitCompareArrows size={15} />,
          key: "expedicion_entrega",
          name: "Expedición y Entrega",
        },
        {
          icon: <ArrowRightLeft size={15} />,
          key: "recogida_devolucion",
          name: "Recogida y Devolución",
        },
        {
          icon: <ClipboardCheck size={15} />,
          key: "cierre",
          name: "Cierre Diario",
        },
        {
          icon: <LayoutGrid size={15} />,
          key: "todo",
          name: "Vista global",
        },
      ] as SidebarSubmenuItem[],
      onSelect: setActiveContent,
      route: "/cierre_eventos",
    });

    return clearSubmenu;
  }, [activeContent, clearSubmenu, setSubmenu, usuario]);

  if (!usuario) return null;

  if (!pageAccess[usuario.rol].includes("cierre_eventos")) {
    return NotAllowed();
  }

  const RenderContent = (content: string) => {
    switch (content) {
      case "expedicion_entrega":
        return (
          <TablaExpedicionEntrega
            fecha={fecha}
            datos={expedicionEntregaData}
            parentLoading={parentLoading}
            parentError={parentError}
            cierreExistente={cierreExistente}
            setDatos={setExpedicionEntregaData}
          />
        );
      case "recogida_devolucion":
        return (
          <TablaRecogidaDevolucion
            fecha={fecha}
            datos={recogidaDevolucionData}
            parentLoading={parentLoading}
            parentError={parentError}
            cierreExistente={cierreExistente}
            setDatos={setRecogidaDevolucionData}
          />
        );
      case "cierre":
        return (
          <CierreDiario
            fecha={fecha}
            usuario={usuario}
            expedicionEntregaData={expedicionEntregaData}
            recogidaDevolucionData={recogidaDevolucionData}
            parentLoading={parentLoading}
            parentError={parentError}
            cierreExistente={cierreExistente}
          />
        );
      default:
        return (
          <div className="space-y-8">
            <TablaExpedicionEntrega
              fecha={fecha}
              datos={expedicionEntregaData}
              parentLoading={parentLoading}
              parentError={parentError}
              cierreExistente={cierreExistente}
              setDatos={setExpedicionEntregaData}
            />
            <TablaRecogidaDevolucion
              fecha={fecha}
              datos={recogidaDevolucionData}
              parentLoading={parentLoading}
              parentError={parentError}
              cierreExistente={cierreExistente}
              setDatos={setRecogidaDevolucionData}
            />
            <CierreDiario
              fecha={fecha}
              usuario={usuario}
              expedicionEntregaData={expedicionEntregaData}
              parentLoading={parentLoading}
              parentError={parentError}
              cierreExistente={cierreExistente}
              recogidaDevolucionData={recogidaDevolucionData}
            />
          </div>
        );
    }
  };

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
        <SelectorFecha />
      </div>
      {parentError && !parentLoading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {parentError}
        </div>
      )}
      {RenderContent(activeContent)}
    </div>
  );
}
