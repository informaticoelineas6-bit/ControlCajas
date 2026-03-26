import {
  Cajas,
  CentroDistribucion,
  Cierre,
  COLECCIONES,
  Tapas,
} from "@/lib/constants";
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
    const centros = db.collection<CentroDistribucion>(
      COLECCIONES.CENTRO_DISTRIBUCION,
    );

    const [centro, cierres] = await Promise.all([
      centros.findOne({ nombre }),
      cierre
        .aggregate<{
          fecha: string;
          ajuste_deuda: Cajas;
          cajas_rotas: Cajas;
          tapas_rotas: Tapas;
        }>([
          {
            $match: {
              "cierre_cd.centro_distribucion": nombre,
            },
          },
          { $unwind: "$cierre_cd" },
          {
            $match: {
              "cierre_cd.centro_distribucion": nombre,
            },
          },
          {
            $project: {
              _id: 0,
              fecha: 1,
              ajuste_deuda: "$cierre_cd.ajuste_deuda",
              cajas_rotas: "$cierre_cd.cajas_rotas",
              tapas_rotas: "$cierre_cd.tapas_rotas",
            },
          },
          { $sort: { fecha: -1 } },
        ])
        .toArray(),
    ]);

    if (!centro) {
      return NextResponse.json(
        { error: "Centro no encontrado" },
        { status: 404 },
      );
    }

    const audit: CentroAudit = {
      centro,
      cierres: cierres.map((item) => ({
        fecha: item.fecha,
        ajuste_deuda: item.ajuste_deuda,
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

export interface CentroAudit {
  centro: CentroDistribucion;
  cierres: {
    fecha: string;
    ajuste_deuda: Cajas;
    cajas_rotas: Cajas;
    tapas_rotas: Tapas;
  }[];
}
