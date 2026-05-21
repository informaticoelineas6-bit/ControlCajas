"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/(app)/user-context";
import { pageAccess, contentCardClass } from "../tabs";
import TablaVehiculos from "@/components/TablaVehiculos";
import TablaAlmacenes from "@/components/TablaAlmacenes";
import TablaCentros from "@/components/TablaCentros";
import TablaProvincias from "@/components/TablaProvincias";
import TablaUsuarios from "@/components/TablaUsuarios";
import NotAllowed from "@/app/not-allowed";
import { useSidebarSubmenu } from "../sidebar-submenu-context";
import { Globe, MapPin, Truck, Users, Warehouse } from "lucide-react";

export default function Administracion() {
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
          icon: <Globe size={15} />,
          key: "provincias",
          name: "Provincias",
        },
        {
          icon: <Users size={15} />,
          key: "usuarios",
          name: "Usuarios",
        },
        {
          icon: <Truck size={15} />,
          key: "vehiculos",
          name: "Vehículos",
        },
      ],
      onSelect: setActiveContent,
      route: "/administracion",
    });

    return clearSubmenu;
  }, [activeContent, clearSubmenu, setSubmenu]);

  if (!usuario) return null;

  if (!pageAccess[usuario.rol].includes("administracion")) {
    return NotAllowed();
  }

  const RenderContent = (content: string) => {
    switch (content) {
      case "almacenes":
        return <TablaAlmacenes usuario={usuario} />;
      case "centros":
        return <TablaCentros usuario={usuario} />;
      case "provincias":
        return <TablaProvincias usuario={usuario} />;
      case "usuarios":
        return <TablaUsuarios usuario={usuario} />;
      case "vehiculos":
      default:
        return <TablaVehiculos usuario={usuario} />;
    }
  };

  return <div className={contentCardClass}>{RenderContent(activeContent)}</div>;
}
