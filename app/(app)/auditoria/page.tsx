"use client";

import { useUser } from "@/app/(app)/user-context";
import { pageAccess, contentCardClass } from "../tabs";
import AuditAlmacen from "@/components/AuditAlmacen";
import AuditCentro from "@/components/AuditCentro";
import AuditUsuario from "@/components/AuditUsuario";
import NotAllowed from "@/app/not-allowed";

export default function Auditoria() {
  const usuario = useUser();

  if (!usuario) return null;

  if (!pageAccess[usuario.rol].includes("auditoria")) {
    return NotAllowed();
  }

  return (
    <div className={contentCardClass}>
      <div className="space-y-8">
        <AuditAlmacen />
        <AuditCentro />
        <AuditUsuario />
      </div>
    </div>
  );
}
