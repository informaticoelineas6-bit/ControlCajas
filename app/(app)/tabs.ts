import { ROLES } from "@/lib/constants";

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

export const contentCardClass =
  "rounded-[32px] border border-white/60 bg-white/78 p-5 shadow-[0_30px_80px_-46px_rgba(15,23,42,0.5)] backdrop-blur sm:p-8";
