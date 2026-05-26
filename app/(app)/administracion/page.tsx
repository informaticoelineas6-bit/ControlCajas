"use client";

import { useState } from "react";
import { useUser } from "@/app/(app)/user-context";
import { pageAccess, contentCardClass, PageTabItem } from "../tabs";
import TablaVehiculos from "@/components/TablaVehiculos";
import TablaAlmacenes from "@/components/TablaAlmacenes";
import TablaCentros from "@/components/TablaCentros";
import TablaProvincias from "@/components/TablaProvincias";
import TablaUsuarios from "@/components/TablaUsuarios";
import NotAllowed from "@/app/not-allowed";
import PageTabs from "@/components/PageTabs";
import { Globe, MapPin, Truck, Users, Warehouse } from "lucide-react";

const tabs: PageTabItem[] = [
  { icon: <Warehouse size={15} />, key: "almacenes", name: "Almacenes" },
  { icon: <MapPin size={15} />, key: "centros", name: "Centros" },
  { icon: <Globe size={15} />, key: "provincias", name: "Provincias" },
  { icon: <Users size={15} />, key: "usuarios", name: "Usuarios" },
  { icon: <Truck size={15} />, key: "vehiculos", name: "Vehículos" },
];

export default function Administracion() {
  const usuario = useUser();
  const [activeContent, setActiveContent] = useState("almacenes");

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
