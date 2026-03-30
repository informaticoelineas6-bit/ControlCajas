"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TablaExpedicionEntrega from "@/components/TablaExpedicionEntrega";
import TablaRecogidaDevolucion from "@/components/TablaRecogidaDevolucion";
import TablaExpedicion from "@/components/TablaExpedicion";
import TablaEntrega from "@/components/TablaEntrega";
import TablaDevolucion from "@/components/TablaDevolucion";
import TablaRecogida from "@/components/TablaRecogida";
import TablaVehiculos from "@/components/TablaVehiculos";
import TablaAlmacenes from "@/components/TablaAlmacenes";
import TablaCentros from "@/components/TablaCentros";
import {
  Evento,
  ItemComparacionEntrega,
  ItemComparacionRecogida,
  ROLES,
  TIPOS_EVENTO,
  Usuario,
} from "@/lib/constants";
import CierreDiario from "@/components/CierreDiario";
import TablaUsuarios from "@/components/TablaUsuarios";
import TablaInformacion from "@/components/TablaInformacion";
import TablaTraspaso from "@/components/TablaTraspaso";
import FormularioEvento, { AjusteProp } from "@/components/FormularioEvento";
import TablaProvincias from "@/components/TablaProvincias";
import AuditAlmacen from "@/components/AuditAlmacen";
import AuditCentro from "@/components/AuditCentro";
import AuditUsuario from "@/components/AuditUsuario";

type TabNames =
  | "new_eventos"
  | "mis_eventos"
  | "cierre_eventos"
  | "dashboard"
  | "administracion"
  | "auditoria";

interface DashboardTab {
  key: TabNames;
  title: string;
  helper: string;
  description: string;
}

const pageAccess: Record<ROLES, TabNames[]> = {
  almacenero: ["new_eventos", "mis_eventos"],
  auditor: ["dashboard", "auditoria", "cierre_eventos", "administracion"],
  chofer: ["new_eventos", "mis_eventos"],
  expedidor: ["new_eventos", "mis_eventos"],
  informatico: [
    "administracion",
    "cierre_eventos",
    "mis_eventos",
    "dashboard",
    "auditoria",
  ],
};

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [activeTab, setActiveTab] = useState<TabNames>("mis_eventos");
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [adjustingEvent, setAdjustingEvent] =
    useState<AjusteProp<Evento> | null>(null);
  const [expedicionEntregaData, setExpedicionEntregaData] = useState<
    ItemComparacionEntrega[]
  >([]);
  const [recogidaDevolucionData, setRecogidaDevolucionData] = useState<
    ItemComparacionRecogida[]
  >([]);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (response.ok && data.usuario) {
          setUsuario(data.usuario);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [router]);

  useEffect(() => {
    if (usuario) {
      setActiveTab(pageAccess[usuario.rol][0]);
    } else return;
  }, [usuario]);

  if (loading || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Cargando...</p>
      </div>
    );
  }

  const handleAjustarClick = async (
    tipoEvento: TIPOS_EVENTO,
    eventoId: string,
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

  const pageTabs: Record<TabNames, DashboardTab> = {
    administracion: {
      key: "administracion",
      title: "Administración",
      description: "Administración de datos",
      helper:
        "Crea y actualiza vehículos, almacenes, centros y autoriza la entrada de nuevos usuarios",
    },
    cierre_eventos: {
      key: "cierre_eventos",
      title: "Cierre diario",
      description: "Validación y cierre diario",
      helper:
        "Valida los movimientos del día y dale un cierre a los eventos para actualizar las deudas de forma acorde",
    },
    dashboard: {
      key: "dashboard",
      title: "Tablero general",
      description: "Información general",
      helper:
        "Indicadores de deuda, stock, roturas y otras estadísticas para seguimiento central",
    },
    mis_eventos: {
      key: "mis_eventos",
      description: "Movimientos diarios e históricos",
      helper:
        "Permite visualizar un listado de los eventos de cada día y su ajuste de ser necesario",
      title: "Listado de eventos",
    },
    new_eventos: {
      key: "new_eventos",
      description: "Registro de nuevos eventos",
      helper:
        "Registra expediciones, traspasos, entregas, recogidas o devoluciones de cajas",
      title: "Nuevos eventos",
    },
    auditoria: {
      key: "auditoria",
      description: "Análisis histórico",
      helper:
        "Permite analizar los aportes y el comportamiento de un almacén, centro o usuario a lo largo del tiempo",
      title: "Auditoría",
    },
  };

  const contentCardClass =
    "rounded-[32px] border border-white/60 bg-white/78 p-5 shadow-[0_30px_80px_-46px_rgba(15,23,42,0.5)] backdrop-blur sm:p-8";

  const pageRender: Record<TabNames, React.JSX.Element> = {
    administracion: (
      <div className={contentCardClass}>
        <div className="space-y-8">
          <TablaVehiculos usuario={usuario} />
          <TablaAlmacenes usuario={usuario} />
          <TablaCentros usuario={usuario} />
          <TablaProvincias usuario={usuario} />
          <TablaUsuarios usuario={usuario} />
        </div>
      </div>
    ),
    cierre_eventos: (
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
    ),
    dashboard: <TablaInformacion />,
    mis_eventos: (
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
          {(usuario?.rol === "informatico" || usuario?.rol === "expedidor") && (
            <TablaExpedicion
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
          {(usuario?.rol === "informatico" || usuario?.rol === "chofer") && (
            <TablaTraspaso
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
          {(usuario?.rol === "informatico" || usuario?.rol === "chofer") && (
            <TablaEntrega
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
          {(usuario?.rol === "informatico" || usuario?.rol === "chofer") && (
            <TablaRecogida
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
          {(usuario?.rol === "informatico" ||
            usuario?.rol === "almacenero") && (
            <TablaDevolucion
              usuario={usuario}
              fecha={fecha}
              onAjustar={handleAjustarClick}
            />
          )}
        </div>
      </div>
    ),
    new_eventos: (
      <div className={contentCardClass}>
        <FormularioEvento usuario={usuario} />
      </div>
    ),
    auditoria: (
      <div className={contentCardClass}>
        <div className="space-y-8">
          <AuditAlmacen />
          <AuditCentro />
          <AuditUsuario />
        </div>
      </div>
    ),
  };

  return (
    <>
      <Header usuario={usuario} />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_48%,_#f8fafc_100%)]">
        <div className="mx-auto max-lg:max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-[34px] bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92))] p-5 text-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.95)]">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-200/80">
                  Control de cajas
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  {usuario.nombre}
                </h2>
                <p className="mt-2 text-sm capitalize text-slate-300">
                  {usuario.rol}
                </p>
              </div>

              <nav className="mt-6 space-y-2">
                {pageAccess[usuario.rol].map((item) => {
                  const isActive = activeTab === item;
                  return (
                    <button
                      key={item}
                      title={pageTabs[item].helper}
                      onClick={() => setActiveTab(item)}
                      className={`w-full rounded-[22px] px-4 py-4 text-left transition ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_18px_35px_-18px_rgba(59,130,246,0.9)]"
                          : "bg-white/0 text-slate-200 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <p className="text-base font-semibold">
                        {pageTabs[item].title}
                      </p>
                      <p
                        className={`mt-1 text-sm ${
                          isActive ? "text-blue-50" : "text-slate-400"
                        }`}
                      >
                        {pageTabs[item].description}
                      </p>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <main className="space-y-6">
              {pageAccess[usuario.rol].includes(activeTab) ? (
                pageRender[activeTab]
              ) : (
                <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
                  No tiene acceso a esta información.
                </div>
              )}
            </main>
          </div>
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
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
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
