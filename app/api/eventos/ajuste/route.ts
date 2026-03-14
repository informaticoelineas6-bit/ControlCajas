import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { userRole } from "../../utils";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { tipo_evento, id, ajuste, nombre } = data;

    if (!tipo_evento || !id || !ajuste || !nombre) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const useRole = userRole(request);
    if (useRole === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (useRole !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const collection = db.collection(tipo_evento);

    const filter = { _id: ObjectId.createFromHexString(id) };
    const update = {
      $set: {
        ajuste: { ...ajuste, nombre },
      },
    };

    const result = await collection.updateOne(filter, update);
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error adjusting event:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
