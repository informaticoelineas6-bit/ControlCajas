import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { usuarioCookie } from "../../../../lib/utils";
import { EventoAjusteForm } from "@/components/FormularioEvento";
import { EVENTOS_ARRAY } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const data = await request.json();
    const { tipo_evento, ajuste }: EventoAjusteForm = data;

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

    const { db } = await connectToDatabase();
    const collection = db.collection(tipo_evento);

    const filter = { _id: ObjectId.createFromHexString(id) };
    const update = ["Devolucion", "Recogida"].includes(tipo_evento)
      ? {
          $set: {
            ajuste: {
              cajas: ajuste.cajas,
              cajas_rotas: ajuste.cajas_rotas,
              tapas_rotas: ajuste.tapas_rotas,
              nombre: usuario.nombre,
            },
          },
        }
      : {
          $set: {
            ajuste: { cajas: ajuste.cajas, nombre: usuario.nombre },
          },
        };

    const result = await collection.updateOne(filter, update);
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Evento actualizado exitosamente.",
    });
  } catch (err) {
    console.error("Error adjusting event:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
