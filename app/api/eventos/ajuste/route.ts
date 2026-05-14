import { getErrorMessage } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { usuarioCookie } from "@/lib/auth";
import { AjusteCajas, AjusteRoturas, EventoAjusteForm } from "@/lib/constants";
import { EVENTOS_ARRAY, getEventTable } from "@/lib/constants";
import { format } from "date-fns";

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
          fechaHora: format(new Date(), "yyyy-MM-dd"),
          nombre: usuario.nombre,
          cajas: ajuste.cajas,
          roturas:
            "roturas" in ajuste
              ? {
                  cajas: ajuste.roturas.cajas,
                  tapas: ajuste.roturas.tapas,
                }
              : undefined,
        } as AjusteCajas | AjusteRoturas,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Evento actualizado exitosamente.",
    });
  } catch (error) {
    console.error("Error adjusting event:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
