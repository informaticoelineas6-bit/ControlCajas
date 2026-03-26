import { Almacen, Cajas, Cierre, COLECCIONES, Tapas } from "@/lib/constants";
import { connectToDatabase } from "@/lib/mongodb";
import { usuarioCookie } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get("nombre");

    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const cierre = db.collection<Cierre>(COLECCIONES.CIERRE);
    const almacenes = db.collection<Almacen>(COLECCIONES.ALMACEN);

    const [almacen, cierres] = await Promise.all([
      almacenes.findOne({ nombre }),
      cierre
        .aggregate<{
          fecha: string;
          ajuste_stock: Cajas;
          cajas_rotas: Cajas;
          tapas_rotas: Tapas;
        }>([
          {
            $match: {
              "cierre_almacen.almacen": nombre,
            },
          },
          { $unwind: "$cierre_almacen" },
          {
            $match: {
              "cierre_almacen.almacen": nombre,
            },
          },
          {
            $project: {
              _id: 0,
              fecha: 1,
              ajuste_stock: "$cierre_almacen.ajuste_stock",
              cajas_rotas: "$cierre_almacen.cajas_rotas",
              tapas_rotas: "$cierre_almacen.tapas_rotas",
            },
          },
          { $sort: { fecha: -1 } },
        ])
        .toArray(),
    ]);

    if (!almacen) {
      return NextResponse.json(
        { error: "Almacén no encontrado" },
        { status: 404 },
      );
    }

    const audit: AlmacenAudit = {
      almacen,
      cierres: cierres.map((item) => ({
        fecha: item.fecha,
        ajuste_stock: item.ajuste_stock,
        cajas_rotas: item.cajas_rotas,
        tapas_rotas: item.tapas_rotas,
      })),
    };

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 },
    );
  }
}

export interface AlmacenAudit {
  almacen: Almacen;
  cierres: {
    fecha: string;
    ajuste_stock: Cajas;
    cajas_rotas: Cajas;
    tapas_rotas: Tapas;
  }[];
}
