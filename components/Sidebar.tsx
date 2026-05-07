"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabNames } from "@/app/(app)/tabs";
import { ROLES, Usuario } from "@/lib/constants";
import { prettyName } from "@/lib/utils";
import {
  Plus,
  List,
  Lock,
  LayoutDashboard,
  Settings,
  Shield,
} from "lucide-react";

interface DashboardTab {
  key: TabNames;
  title: string;
  helper: string;
  icons: React.ReactNode;
  description: string;
}

const pageTabs: Record<TabNames, DashboardTab> = {
  administracion: {
    key: "administracion",
    title: "Administración",
    description: "Administración de datos",
    icons: <Settings size={18} />,
    helper:
      "Crea y actualiza vehículos, almacenes, centros y autoriza la entrada de nuevos usuarios",
  },
  cierre_eventos: {
    key: "cierre_eventos",
    title: "Cierre diario",
    description: "Validación y cierre diario",
    icons: <Lock size={18} />,
    helper:
      "Valida los movimientos del día y dale un cierre a los eventos para actualizar las deudas de forma acorde",
  },
  dashboard: {
    key: "dashboard",
    title: "Tablero general",
    description: "Información general",
    icons: <LayoutDashboard size={18} />,
    helper:
      "Indicadores de deuda, stock, roturas y otras estadísticas para seguimiento central",
  },
  mis_eventos: {
    key: "mis_eventos",
    title: "Listado de eventos",
    description: "Movimientos diarios e históricos",
    icons: <List size={18} />,
    helper:
      "Permite visualizar un listado de los eventos de cada día y su ajuste de ser necesario",
  },
  new_eventos: {
    key: "new_eventos",
    title: "Nuevos eventos",
    description: "Registro de nuevos eventos",
    icons: <Plus size={18} />,
    helper:
      "Registra expediciones, traspasos, entregas, recogidas o devoluciones de cajas",
  },
  auditoria: {
    key: "auditoria",
    title: "Auditoría",
    description: "Análisis histórico",
    icons: <Shield size={18} />,
    helper:
      "Permite analizar los aportes y el comportamiento de un almacén, centro o usuario a lo largo del tiempo",
  },
};

interface SidebarProps {
  usuario: Usuario;
  pageAccess: Record<ROLES, TabNames[]>;
}

export default function Sidebar({ usuario, pageAccess }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = pageAccess[usuario.rol];

  return (
    <>
      {/* Desktop: full vertical sidebar — hidden below md */}
      <aside className="md:flex md:flex-col rounded-[34px] bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92))] p-2 lg:p-5 text-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.95)] md:w-[260px] md:shrink-0 md:overflow-y-auto">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-200/80">
            Control de cajas
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {prettyName(usuario.nombre)}
          </h2>
          <p className="mt-2 text-sm capitalize text-slate-300">
            {usuario.rol}
          </p>
        </div>

        <nav className="mt-6 space-y-2">
          {tabs.map((item) => {
            const isActive = pathname === `/${item}`;
            return (
              <button
                key={item}
                title={pageTabs[item].helper}
                onClick={() => router.push(`/${item}`)}
                className={`w-full rounded-[22px] px-4 py-4 text-left transition ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_18px_35px_-18px_rgba(59,130,246,0.9)]"
                    : "bg-white/0 text-slate-200 hover:bg-white/8 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  {pageTabs[item].icons}
                  <p className="text-base font-semibold">
                    {pageTabs[item].title}
                  </p>
                </div>
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

      {/* Mobile: compact sticky icon navbar — hidden at md+ */}
      <div className="sticky top-0 z-30 p-2 md:hidden bg-slate-50/90 backdrop-blur-sm">
        <nav className="flex items-center justify-around rounded-[28px] bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92))] py-2 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.5)]">
          {tabs.map((item) => {
            const isActive = pathname === `/${item}`;
            return (
              <button
                key={item}
                title={pageTabs[item].title}
                onClick={() => router.push(`/${item}`)}
                className={`rounded-[18px] p-3 transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_8px_20px_-8px_rgba(59,130,246,0.8)]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {pageTabs[item].icons}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
