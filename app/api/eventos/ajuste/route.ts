import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { usuarioCookie } from "@/lib/auth";
import { EventoAjusteForm } from "@/components/FormularioEvento";
import { EVENTOS_ARRAY, getEventTable } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { tipo_evento, ajuste }: EventoAjusteForm = await request.json();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!tipo_evento || !id || !ajuste || !usuario.nombre) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!EVENTOS_ARRAY.includes(tipo_evento)) {
      return NextResponse.json(
        { error: "Tipo de evento inválido" },
        { status: 400 },
      );
    }

    const db = (await connectToDatabase()).from(getEventTable[tipo_evento]);

    const { error } = await db
      .update({
        ajuste: {
          fechaHora: new Date().toISOString(),
          nombre: usuario.nombre,
          cajas: ajuste.cajas,
          roturas:
            "roturas" in ajuste
              ? {
                  cajas: ajuste.roturas.cajas,
                  tapas: ajuste.roturas.tapas,
                }
              : undefined,
        },
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Evento actualizado exitosamente.",
    });
  } catch (err) {
    console.error("Error adjusting event:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
