import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, getErrorMessage } from "@/lib/server";
import { Provincia, TABLAS } from "@/lib/constants";
import { getUsuario } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = await getUsuario(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const db = (await connectToDatabase()).from(TABLAS.PROVINCIA);

    const { data, error } = await db
      .select<string, Provincia>("nombre, centro_distribucion")
      .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null")
      .order("nombre");

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching provincias:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
