import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Almacen, COLECCIONES } from "@/lib/constants";
import { isEnabled, usuarioCookie } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const almacenes = db.collection<Almacen>(COLECCIONES.ALMACEN);
    const listaAlmacenes = (await almacenes.find({}).toArray()).filter(
      isEnabled,
    );
    return NextResponse.json(
      listaAlmacenes.map((alm): Almacen => {
        return {
          nombre: alm.nombre,
          habilitado: alm.habilitado,
          stock: alm.stock,
          roturas: alm.roturas,
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
