import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { applyAjuste } from "@/lib/utils";
import { usuarioCookie } from "@/lib/auth";
import {
  Evento,
  EVENTOS_ARRAY,
  getEventTable,
  TIPOS_EVENTO,
} from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");
    const tipo_evento = searchParams.get("tipo"); // Expedicion|Entrega|Devolucion|Recogida

    if (!fecha || !tipo_evento) {
      return NextResponse.json(
        { error: "Fecha y tipo son requeridos" },
        { status: 400 },
      );
    }

    if (!EVENTOS_ARRAY.includes(tipo_evento as TIPOS_EVENTO)) {
      return NextResponse.json(
        { error: "Tipo de evento inválido" },
        { status: 400 },
      );
    }

    const db = (await connectToDatabase()).from(
      getEventTable[tipo_evento as TIPOS_EVENTO],
    );

    const { data, error } =
      usuario.rol === "informatico"
        ? await db.select<string, Evento>("*").eq("fecha", fecha)
        : await db
            .select<string, Evento>("*")
            .eq("fecha", fecha)
            .eq("nombre", usuario.nombre);

    if (error) throw new Error(error.message);

    const adjItems = data.map(applyAjuste);

    return NextResponse.json(adjItems);
  } catch (error) {
    console.error("Error listing events:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 },
    );
  }
}
