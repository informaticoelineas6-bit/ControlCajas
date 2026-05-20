import { TABLAS } from "@/lib/constants";
import { connectToDatabase, getErrorMessage } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { getUsuario } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const usuario = await getUsuario(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const fecha = format(new Date(), "yyyy-MM-dd");

    const db = (await connectToDatabase()).from(TABLAS.CIERRE);
    const { count, error } = await db
      .select("*", { count: "exact", head: true })
      .eq("fecha", fecha);

    if (error) throw new Error(error.message);

    return NextResponse.json({ fecha, existente: Boolean(count) });
  } catch (error) {
    console.error("Error al obtener cierre:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
