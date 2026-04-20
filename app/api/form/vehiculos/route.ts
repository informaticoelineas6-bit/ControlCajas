import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { TABLAS, Vehiculo } from "@/lib/constants";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const db = (await connectToDatabase()).from(TABLAS.VEHICULO);

    const { data, error } = await db
      .select<string, Vehiculo>("categoria, chapa, marca, modelo")
      .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null")
      .order("categoria")
      .order("chapa");

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching vehiculos:", error);
    return NextResponse.json(
      { error: "Error al obtener vehículos" },
      { status: 500 },
    );
  }
}
