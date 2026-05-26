import { ROLES, Usuario } from "@/lib/constants";
import {
  Plus,
  List,
  Lock,
  LayoutDashboard,
  Settings,
  Shield,
} from "lucide-react";

export type TabNames =
  | "new_eventos"
  | "mis_eventos"
  | "cierre_eventos"
  | "dashboard"
  | "administracion"
  | "auditoria";

export const pageAccess: Record<ROLES, TabNames[]> = {
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

export interface PageTabItem {
  icon: React.ReactNode;
  key: string;
  name: string;
}

export interface NavProps {
  usuario: Usuario;
  pageAccess: Record<ROLES, TabNames[]>;
}

export interface DashboardTab {
  key: TabNames;
  title: string;
  helper: string;
  icons: React.ReactNode;
  description: string;
}

export const pageTabs: Record<TabNames, DashboardTab> = {
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

export const contentCardClass =
  "rounded-[32px] border border-white/60 bg-white/78 p-5 shadow-[0_30px_80px_-46px_rgba(15,23,42,0.5)] backdrop-blur sm:p-8";
