"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/(app)/user-context";
import { pageAccess, contentCardClass } from "../tabs";
import AuditAlmacen from "@/components/AuditAlmacen";
import AuditCentro from "@/components/AuditCentro";
import AuditUsuario from "@/components/AuditUsuario";
import NotAllowed from "@/app/not-allowed";
import { useSidebarSubmenu } from "../sidebar-submenu-context";
import { MapPin, Users, Warehouse } from "lucide-react";

export default function Auditoria() {
  const usuario = useUser();
  const { clearSubmenu, setSubmenu } = useSidebarSubmenu();
  const [activeContent, setActiveContent] = useState("almacenes");

  useEffect(() => {
    setSubmenu({
      activeKey: activeContent,
      items: [
        {
          icon: <Warehouse size={15} />,
          key: "almacenes",
          name: "Almacenes",
        },
        {
          icon: <MapPin size={15} />,
          key: "centros",
          name: "Centros",
        },
        {
          icon: <Users size={15} />,
          key: "usuarios",
          name: "Usuarios",
        },
      ],
      onSelect: setActiveContent,
      route: "/auditoria",
    });

    return clearSubmenu;
  }, [activeContent, clearSubmenu, setSubmenu]);

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

  return <div className={contentCardClass}>{RenderContent(activeContent)}</div>;
}
