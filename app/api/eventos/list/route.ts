import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");
    const tipo = searchParams.get("tipo"); // Expedicion|Transporte|Devolucion|Recogida

    if (!fecha || !tipo) {
      return NextResponse.json(
        { error: "Fecha y tipo son requeridos" },
        { status: 400 },
      );
    }

    const usuarioCookie = request.cookies.get("usuario");
    let usuario: any = null;
    if (usuarioCookie) {
      try {
        usuario = JSON.parse(usuarioCookie.value);
      } catch {
        // ignore parse errors
      }
    }

    const { db } = await connectToDatabase();

    const mapping: Record<string, string> = {
      Expedicion: "Expedicion",
      Transporte: "Transporte",
      Devolucion: "Devolucion",
      Recogida: "Recogida",
    };

    const collectionName = mapping[tipo];
    if (!collectionName) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const filter: any = { fecha };
    // Si no es informatico, limitar a los eventos creados por el usuario
    if (!usuario) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (usuario?.rol !== "informatico") {
      filter.nombre = usuario.nombre;
    }

    const items = await db.collection(collectionName).find(filter).toArray();

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error listing events:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 },
    );
  }
}
