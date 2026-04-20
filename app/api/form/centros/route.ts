import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { CentroDistribucion, TABLAS } from "@/lib/constants";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const db = (await connectToDatabase()).from(TABLAS.CENTRO_DISTRIBUCION);

    const { data, error } = await db
      .select<
        string,
        CentroDistribucion
      >("nombre, habilitado, deuda, rotacion, roturas")
      .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null")
      .order("nombre");

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching centros:", error);
    return NextResponse.json(
      { error: "Error al obtener centros" },
      { status: 500 },
    );
  }
}
