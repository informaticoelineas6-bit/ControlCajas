"use client";

import { useUser } from "@/app/(app)/user-context";
import { pageAccess } from "../tabs";
import TablaInformacion from "@/components/TablaInformacion";
import NotAllowed from "@/app/not-allowed";

export default function DashboardPage() {
  const usuario = useUser();

  if (!usuario) return null;

  if (!pageAccess[usuario.rol].includes("dashboard")) {
    return NotAllowed();
  }

  return <TablaInformacion />;
}
