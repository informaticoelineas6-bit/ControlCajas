"use client";

import { useUser } from "@/app/(app)/user-context";
import { pageAccess, contentCardClass } from "../tabs";
import FormularioEvento from "@/components/FormularioEvento";
import NotAllowed from "@/app/not-allowed";

export default function NewEventos() {
  const usuario = useUser();

  if (!usuario) return null;

  if (!pageAccess[usuario.rol].includes("new_eventos")) {
    return NotAllowed();
  }

  return (
    <div className={contentCardClass}>
      <FormularioEvento usuario={usuario} />
    </div>
  );
}
