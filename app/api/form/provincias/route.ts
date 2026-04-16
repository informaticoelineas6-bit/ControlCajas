import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { Provincia, TABLAS } from "@/lib/constants";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const db = (await connectToDatabase()).from(TABLAS.PROVINCIA);

    const { data, error } = await db
      .select<string, Provincia>("nombre, centro_distribucion")
      .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null");

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching almacenes:", error);
    return NextResponse.json(
      { error: "Error al obtener almacenes" },
      { status: 500 },
    );
  }
}
