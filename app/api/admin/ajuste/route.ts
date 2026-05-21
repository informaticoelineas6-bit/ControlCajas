import { getErrorMessage } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { usuarioCookie } from "@/lib/auth";
import {
  AjusteObjetos,
  getObjectTable,
  ObjetoAjusteForm,
  OBJETOS_ARRAY,
} from "@/lib/constants";
import { format } from "date-fns";

export async function PUT(request: NextRequest) {
  try {
    const usuario = await usuarioCookie(request);
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
          fechaHora: format(new Date(), "yyyy-MM-dd"),
          habilitado: ajuste.habilitado,
          nombre: usuario.nombre,
        } as AjusteObjetos,
      })
      .eq(tipo_objeto === "Vehiculo" ? "chapa" : "nombre", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Objeto actualizado exitosamente.",
    });
  } catch (error) {
    console.error("Error ajustando objeto:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
