import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CentroDistribucion, COLECCIONES } from "@/lib/constants";
import { isEnabled, usuarioCookie } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const centros = db.collection<CentroDistribucion>(
      COLECCIONES.CENTRO_DISTRIBUCION,
    );
    const listaCentros = (await centros.find({}).toArray()).filter(isEnabled);
    return NextResponse.json(
      listaCentros.map((cent): CentroDistribucion => {
        return {
          deuda: cent.deuda,
          habilitado: cent.habilitado,
          nombre: cent.nombre,
          rotacion: cent.rotacion,
          roturas: cent.roturas,
        };
      }),
    );
  } catch (error) {
    console.error("Error fetching centros:", error);
    return NextResponse.json(
      { error: "Error al obtener centros" },
      { status: 500 },
    );
  }
}
