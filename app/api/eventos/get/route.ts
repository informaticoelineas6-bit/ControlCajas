import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { usuarioCookie } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const id = searchParams.get("id");

    if (!tipo || !id) {
      return NextResponse.json(
        { error: "Tipo e id son requeridos" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(tipo);
    const item = await collection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 },
      );
    }
    // convert _id to string
    return NextResponse.json({ ...item, _id: item._id.toString(), tipo: tipo });
  } catch (err) {
    console.error("Error fetching event detail:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
