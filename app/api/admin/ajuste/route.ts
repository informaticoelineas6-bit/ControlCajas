import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { usuarioCookie } from "@/lib/utils";
import { AjusteObjetos, OBJETOS_ARRAY, TIPOS_OBJETOS } from "@/lib/constants";

export async function PUT(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const data = await request.json();
    const { tipo_objeto, ajuste }: ObjetoAjusteForm = data;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!tipo_objeto || !id || !ajuste || !usuario.nombre) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!OBJETOS_ARRAY.includes(tipo_objeto)) {
      return NextResponse.json(
        { error: "Tipo de evento inválido" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(tipo_objeto);

    const filter = { _id: ObjectId.createFromHexString(id) };
    const update = {
      $set: {
        ajuste: {
          fechaHora: new Date().toISOString(),
          habilitado: ajuste.habilitado,
          nombre: usuario.nombre,
        } as AjusteObjetos,
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

export interface ObjetoAjusteForm {
  tipo_objeto?: TIPOS_OBJETOS;
  ajuste: AjusteObjetos;
}
