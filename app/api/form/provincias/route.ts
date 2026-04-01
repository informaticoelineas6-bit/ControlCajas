import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { COLECCIONES, Provincia } from "@/lib/constants";
import { isEnabled, usuarioCookie } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const provincias = db.collection<Provincia>(COLECCIONES.PROVINCIA);
    const listaProvincias = (await provincias.find({}).toArray()).filter(
      isEnabled,
    );
    return NextResponse.json(
      listaProvincias.map((prov): Provincia => {
        return {
          centro_distribucion: prov.centro_distribucion,
          nombre: prov.nombre,
        };
      }),
    );
  } catch (error) {
    console.error("Error fetching almacenes:", error);
    return NextResponse.json(
      { error: "Error al obtener almacenes" },
      { status: 500 },
    );
  }
}
