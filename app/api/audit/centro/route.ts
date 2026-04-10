import {
  Cajas,
  CajasRoturas,
  CentroDistribucion,
  Cierre,
  TABLAS,
} from "@/lib/constants";
import { connectToDatabase } from "@/lib/server";
import { usuarioCookie } from "@/lib/auth";
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

    const db = await connectToDatabase();

    const [centroRaw, cierresRaw] = await Promise.all([
      db
        .from(TABLAS.CENTRO_DISTRIBUCION)
        .select<string, CentroDistribucion>()
        .eq("nombre", nombre),
      db
        .from(TABLAS.CIERRE)
        .select<string, Cierre>("fecha, cierre_cd")
        .contains(
          "cierre_cd",
          JSON.stringify([{ centro_distribucion: nombre }]),
        )
        .order("fecha", { ascending: false }), //TODO: Hacer una función SQL dedicada para filtrar
    ]);

    const error = centroRaw.error || cierresRaw.error;

    if (error) throw new Error(error.message);

    if (centroRaw.data.length === 0) {
      return NextResponse.json(
        { error: "Centro no encontrado" },
        { status: 404 },
      );
    }

    const audit: CentroAudit = {
      centro: centroRaw.data[0],
      cierres: cierresRaw.data.map((item) => {
        const cierre_cd = item.cierre_cd.find(
          (cierre) => cierre.centro_distribucion === nombre,
        );
        return {
          fecha: item.fecha,
          ajuste_deuda: cierre_cd?.ajuste_deuda ?? {
            blancas: 0,
            negras: 0,
            verdes: 0,
          },
          roturas: cierre_cd?.roturas ?? {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            tapas: { blancas: 0, negras: 0 },
          },
        };
      }),
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
  cierres: ({
    fecha: string;
    ajuste_deuda: Cajas;
  } & CajasRoturas)[];
}
