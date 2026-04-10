import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { usuarioCookie } from "@/lib/auth";
import {
  AjusteObjetos,
  getObjectTable,
  OBJETOS_ARRAY,
  TIPOS_OBJETOS,
} from "@/lib/constants";

export async function PUT(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { tipo_objeto, ajuste }: ObjetoAjusteForm = await request.json();

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

    const db = (await connectToDatabase()).from(getObjectTable[tipo_objeto]);

    const { error } = await db
      .update({
        ajuste: {
          fechaHora: new Date().toISOString(),
          habilitado: ajuste.habilitado,
          nombre: usuario.nombre,
        },
      })
      .eq(tipo_objeto === "Vehiculo" ? "chapa" : "nombre", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Objeto actualizado exitosamente.",
    });
  } catch (error) {
    console.error("Error ajustando objeto:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export interface ObjetoAjusteForm {
  tipo_objeto?: TIPOS_OBJETOS;
  ajuste: AjusteObjetos;
}
