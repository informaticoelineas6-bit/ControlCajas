"use client";

import { useUser } from "@/app/(app)/user-context";
import { pageAccess, contentCardClass } from "../tabs";
import TablaVehiculos from "@/components/TablaVehiculos";
import TablaAlmacenes from "@/components/TablaAlmacenes";
import TablaCentros from "@/components/TablaCentros";
import TablaProvincias from "@/components/TablaProvincias";
import TablaUsuarios from "@/components/TablaUsuarios";
import NotAllowed from "@/app/not-allowed";

export default function Administracion() {
  const usuario = useUser();

  if (!usuario) return null;

  if (!pageAccess[usuario.rol].includes("administracion")) {
    return NotAllowed();
  }

  return (
    <div className={contentCardClass}>
      <div className="space-y-8">
        <TablaVehiculos usuario={usuario} />
        <TablaAlmacenes usuario={usuario} />
        <TablaCentros usuario={usuario} />
        <TablaProvincias usuario={usuario} />
        <TablaUsuarios usuario={usuario} />
      </div>
    </div>
  );
}
