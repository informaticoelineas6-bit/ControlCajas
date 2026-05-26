"use client";

import { useState } from "react";
import { useUser } from "@/app/(app)/user-context";
import { pageAccess, contentCardClass, PageTabItem } from "../tabs";
import AuditAlmacen from "@/components/AuditAlmacen";
import AuditCentro from "@/components/AuditCentro";
import AuditUsuario from "@/components/AuditUsuario";
import NotAllowed from "@/app/not-allowed";
import PageTabs from "@/components/PageTabs";
import { MapPin, Users, Warehouse } from "lucide-react";

const tabs: PageTabItem[] = [
  { icon: <Warehouse size={15} />, key: "almacenes", name: "Almacenes" },
  { icon: <MapPin size={15} />, key: "centros", name: "Centros" },
  { icon: <Users size={15} />, key: "usuarios", name: "Usuarios" },
];

export default function Auditoria() {
  const usuario = useUser();
  const [activeContent, setActiveContent] = useState("almacenes");

  if (!usuario) return null;

  if (!pageAccess[usuario.rol].includes("auditoria")) {
    return NotAllowed();
  }

  const RenderContent = (content: string) => {
    switch (content) {
      case "centros":
        return <AuditCentro />;
      case "usuarios":
        return <AuditUsuario />;
      case "almacenes":
      default:
        return <AuditAlmacen />;
    }
  };

  return (
    <div className={contentCardClass}>
      <PageTabs
        items={tabs}
        activeKey={activeContent}
        onSelect={setActiveContent}
      />
      {RenderContent(activeContent)}
    </div>
  );
}
