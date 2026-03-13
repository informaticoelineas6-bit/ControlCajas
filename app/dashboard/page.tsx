"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import FormularioEvento from "@/components/FormularioEvento";
import TablaExpedicionEntrega, {
  ItemExpedicionEntrega,
} from "@/components/TablaExpedicionEntrega";
import TablaRecogidaDevolucion, {
  ItemRecogidaDevolucion,
} from "@/components/TablaRecogidaDevolucion";
import TablaExpedicion from "@/components/TablaExpedicion";
import TablaEntrega from "@/components/TablaEntrega";
import TablaDevolucion from "@/components/TablaDevolucion";
import TablaRecogida from "@/components/TablaRecogida";
import TablaVehiculos from "@/components/TablaVehiculos";
import TablaAlmacenes from "@/components/TablaAlmacenes";
import TablaCentros from "@/components/TablaCentros";
import {
  Devolucion,
  Entrega,
  Expedicion,
  Recogida,
  Usuario,
} from "@/lib/constants";
import CierreDiario from "@/components/CierreDiario";
import TablaUsuarios from "@/components/TablaUsuarios";
import TablaInformacion from "@/components/TablaInformacion";

interface Evento {
  _id: string;
  tipo_evento: string;
  [key: string]: unknown;
}

type DashboardTab =
  | "eventos"
  | "mis_eventos"
  | "ver_eventos"
  | "informacion"
  | "administracion";

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("mis_eventos");
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [adjustingEvent, setAdjustingEvent] = useState<Evento | null>(null);
  const [expedicionEntregaData, setExpedicionEntregaData] = useState<
    ItemExpedicionEntrega[]
  >([]);
  const [recogidaDevolucionData, setRecogidaDevolucionData] = useState<
    ItemRecogidaDevolucion[]
  >([]);

  const [expedicionData, setExpedicionData] = useState<Expedicion[]>([]);
  const [entregaData, setEntregaData] = useState<Entrega[]>([]);
  const [recogidaData, setRecogidaData] = useState<Recogida[]>([]);
  const [devolucionData, setDevolucionData] = useState<Devolucion[]>([]);

  const [expedicionLoading, setExpedicionLoading] = useState<boolean>(false);
  const [entregaLoading, setEntregaLoading] = useState<boolean>(false);
  const [recogidaLoading, setRecogidaLoading] = useState<boolean>(false);
  const [devolucionLoading, setDevolucionLoading] = useState<boolean>(false);

  const [expedicionError, setExpedicionError] = useState<string>("");
  const [entregaError, setEntregaError] = useState<string>("");
  const [recogidaError, setRecogidaError] = useState<string>("");
  const [devolucionError, setDevolucionError] = useState<string>("");

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
    if (!usuario) {
      return;
    }

    setActiveTab(usuario.rol === "informatico" ? "informacion" : "mis_eventos");
  }, [usuario]);

  useEffect(() => {
    fetchDatosExpedicion();
    fetchDatosEntrega();
    fetchDatosRecogida();
    fetchDatosDevolucion();
  }, [fecha]);

  const fetchDatosExpedicion = async () => {
    setExpedicionLoading(true);
    setExpedicionError("");
    try {
      const res = await fetch(
        `/api/eventos/list?fecha=${fecha}&tipo=Expedicion`,
      );
      const data = await res.json();
      if (res.ok) {
        setExpedicionData(data);
      } else {
        setExpedicionError(data.error || "Error al cargar eventos");
      }
    } catch {
      setExpedicionError("Error en el servidor");
    } finally {
      setExpedicionLoading(false);
    }
  };

  const fetchDatosEntrega = async () => {
    setEntregaLoading(true);
    setEntregaError("");
    try {
      const res = await fetch(`/api/eventos/list?fecha=${fecha}&tipo=Entrega`);
      const data = await res.json();
      if (res.ok) {
        setEntregaData(data);
      } else {
        setEntregaError(data.error || "Error al cargar eventos");
      }
    } catch {
      setEntregaError("Error en el servidor");
    } finally {
      setEntregaLoading(false);
    }
  };

  const fetchDatosRecogida = async () => {
    setRecogidaLoading(true);
    setRecogidaError("");
    try {
      const res = await fetch(`/api/eventos/list?fecha=${fecha}&tipo=Recogida`);
      const data = await res.json();
      if (res.ok) {
        setRecogidaData(data);
      } else {
        setRecogidaError(data.error || "Error al cargar eventos");
      }
    } catch {
      setRecogidaError("Error en el servidor");
    } finally {
      setRecogidaLoading(false);
    }
  };

  const fetchDatosDevolucion = async () => {
    setDevolucionLoading(true);
    setDevolucionError("");
    try {
      const res = await fetch(
        `/api/eventos/list?fecha=${fecha}&tipo=Devolucion`,
      );
      const data = await res.json();
      if (res.ok) {
        setDevolucionData(data);
      } else {
        setDevolucionError(data.error || "Error al cargar eventos");
      }
    } catch {
      setDevolucionError("Error en el servidor");
    } finally {
      setDevolucionLoading(false);
    }
  };

  if (loading || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Cargando...</p>
      </div>
    );
  }

  const handleAjustarClick = async (tipoEvento: string, eventoId: string) => {
    try {
      const res = await fetch(
        `/api/eventos/get?tipo=${tipoEvento}&id=${eventoId}`,
      );
      const evento = await res.json();
      if (res.ok) {
        setAdjustingEvent({ ...evento, tipo_evento: tipoEvento });
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  const isInformatico = usuario.rol === "informatico";
  const tabItems = isInformatico
    ? [
        {
          key: "informacion" as DashboardTab,
          label: "Dashboard",
          helper: "Panel de información",
        },
        {
          key: "ver_eventos" as DashboardTab,
          label: "Eventos del día",
          helper: "Cruce y cierre",
        },
        {
          key: "mis_eventos" as DashboardTab,
          label: "Listado",
          helper: "Seguimiento diario",
        },
        {
          key: "administracion" as DashboardTab,
          label: "Administración",
          helper: "Catálogos base",
        },
      ]
    : [
        {
          key: "eventos" as DashboardTab,
          label: "Nuevo evento",
          helper: "Registrar movimiento",
        },
        {
          key: "mis_eventos" as DashboardTab,
          label: "Mis eventos",
          helper: "Seguimiento diario",
        },
      ];

  const pageTitles: Record<DashboardTab, string> = {
    eventos: "Registro de eventos",
    mis_eventos: isInformatico ? "Listado de eventos" : "Mis eventos",
    ver_eventos: "Cruce operativo diario",
    informacion: "Vista ejecutiva de cajas",
    administracion: "Configuración general",
  };

  const pageDescriptions: Record<DashboardTab, string> = {
    eventos: "Crea expediciones, entregas, recogidas y devoluciones.",
    mis_eventos: "Consulta y ajusta los movimientos relevantes según tu rol.",
    ver_eventos:
      "Compara expediciones con entregas y recogidas con devoluciones.",
    informacion:
      "Indicadores de deuda, stock y rotación para seguimiento central.",
    administracion:
      "Mantén vehículos, almacenes, centros y usuarios habilitados.",
  };

  const contentCardClass =
    "rounded-[32px] border border-white/60 bg-white/78 p-5 shadow-[0_30px_80px_-46px_rgba(15,23,42,0.5)] backdrop-blur sm:p-8";

  const renderDateLabel = () => {
    try {
      return new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(`${fecha}T00:00:00`));
    } catch {
      return fecha;
    }
  };

  function renderView() {
    switch (activeTab) {
      case "eventos":
        return isInformatico ? (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
            Los informáticos no pueden crear eventos.
          </div>
        ) : (
          <div className={contentCardClass}>
            <FormularioEvento usuario={usuario!} />
          </div>
        );
      case "mis_eventos":
        return (
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
              {(isInformatico || usuario?.rol === "expedidor") && (
                <TablaExpedicion
                  usuario={usuario}
                  datos={expedicionData}
                  loading={expedicionLoading}
                  error={expedicionError}
                  onAjustar={handleAjustarClick}
                />
              )}
              {(isInformatico || usuario?.rol === "chofer") && (
                <TablaEntrega
                  usuario={usuario}
                  datos={entregaData}
                  loading={entregaLoading}
                  error={entregaError}
                  onAjustar={handleAjustarClick}
                />
              )}
              {(isInformatico || usuario?.rol === "chofer") && (
                <TablaRecogida
                  usuario={usuario}
                  datos={recogidaData}
                  loading={recogidaLoading}
                  error={recogidaError}
                  onAjustar={handleAjustarClick}
                />
              )}
              {(isInformatico || usuario?.rol === "almacenero") && (
                <TablaDevolucion
                  usuario={usuario}
                  datos={devolucionData}
                  loading={devolucionLoading}
                  error={devolucionError}
                  onAjustar={handleAjustarClick}
                />
              )}
            </div>
          </div>
        );
      case "ver_eventos":
        return isInformatico ? (
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
                expedicionEntregaData={expedicionEntregaData}
                recogidaDevolucionData={recogidaDevolucionData}
                expedicionData={expedicionData}
                recogidaData={recogidaData}
                entregaData={entregaData}
                devolucionData={devolucionData}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
            Sólo los informáticos pueden ver los eventos.
          </div>
        );
      case "informacion":
        return isInformatico ? (
          <TablaInformacion />
        ) : (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
            Sólo los informáticos pueden ver esta información.
          </div>
        );
      case "administracion":
        return isInformatico ? (
          <div className={contentCardClass}>
            <div className="space-y-8">
              <TablaVehiculos usuario={usuario!} />
              <TablaAlmacenes usuario={usuario!} />
              <TablaCentros usuario={usuario!} />
              <TablaUsuarios usuario={usuario!} />
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
            Sólo los informáticos pueden administrar los datos.
          </div>
        );
      default:
        return (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
            Esta vista aún no ha sido implementada.
          </div>
        );
    }
  }

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
                {tabItems.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full rounded-[22px] px-4 py-4 text-left transition ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_18px_35px_-18px_rgba(59,130,246,0.9)]"
                          : "bg-white/0 text-slate-200 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <p className="text-base font-semibold">{item.label}</p>
                      <p
                        className={`mt-1 text-sm ${
                          isActive ? "text-blue-50" : "text-slate-400"
                        }`}
                      >
                        {item.helper}
                      </p>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <main className="space-y-6">
              <section className="overflow-hidden rounded-[34px] border border-white/60 bg-white/72 p-6 shadow-[0_30px_80px_-46px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500">
                      Panel de control
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      {pageTitles[activeTab]}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                      {pageDescriptions[activeTab]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                      {renderDateLabel()}
                    </div>
                    {/* <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                      {isInformatico ? "Modo auditoría" : "Modo operativo"}
                    </div> */}
                  </div>
                </div>
              </section>

              {renderView()}
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
