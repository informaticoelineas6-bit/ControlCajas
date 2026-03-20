import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AjusteStr, applyAjuste, usuarioCookie } from "@/lib/utils";
import {
  Evento,
  EventoRotura,
  EVENTOS_ARRAY,
  TIPOS_EVENTO,
} from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");
    const tipo = searchParams.get("tipo"); // Expedicion|Entrega|Devolucion|Recogida

    if (!fecha || !tipo || !EVENTOS_ARRAY.includes(tipo as TIPOS_EVENTO)) {
      return NextResponse.json(
        { error: "Fecha y tipo son requeridos" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();

    const filter: { fecha: string; nombre?: string } = { fecha };
    if (usuario?.rol !== "informatico") {
      filter.nombre = usuario.nombre;
    }

    const collection = db.collection<Evento>(tipo);
    if (!collection) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const items = (await collection.find(filter).toArray()) as Evento[];

    // convert ObjectId to string and apply ajuste values to cajas
    const adjItems: AjusteStr<Evento | EventoRotura>[] = items.map(
      (elem: Evento | EventoRotura): AjusteStr<Evento | EventoRotura> => {
        const item = {
          ...elem,
          _id: elem._id!.toString(),
        };

        // Apply ajuste to cajas if it exists
        const adjItem = applyAjuste(item);

        return adjItem;
      },
    );

    return NextResponse.json(adjItems);
  } catch (error) {
    console.error("Error listing events:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 },
    );
  }
}
