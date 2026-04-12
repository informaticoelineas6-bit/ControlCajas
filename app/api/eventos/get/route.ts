import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { usuarioCookie } from "@/lib/auth";
import { EVENTOS_ARRAY, getEventTable, TIPOS_EVENTO } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tipo_evento = searchParams.get("tipo");
    const id = searchParams.get("id");

    if (!tipo_evento || !id) {
      return NextResponse.json(
        { error: "Tipo e id son requeridos" },
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

    const { data, error } = await db.select("*").eq("id", id);

    if (error) throw new Error(error.message);

    if (data.length === 0) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...data[0],
      tipo: tipo_evento,
    });
  } catch (err) {
    console.error("Error fetching event detail:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
