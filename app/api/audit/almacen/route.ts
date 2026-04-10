import { Almacen, Cajas, CajasRoturas, Cierre, TABLAS } from "@/lib/constants";
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

    const [almacenRaw, cierresRaw] = await Promise.all([
      db.from(TABLAS.ALMACEN).select<string, Almacen>("*").eq("nombre", nombre),
      db
        .from(TABLAS.CIERRE)
        .select<string, Cierre>("fecha, cierre_almacen")
        .contains("cierre_almacen", JSON.stringify([{ almacen: nombre }]))
        .order("fecha", { ascending: false }), //TODO: Hacer una función SQL dedicada para filtrar
    ]);

    const error = almacenRaw.error || cierresRaw.error;

    if (error) throw new Error(error.message);

    if (almacenRaw.data.length === 0) {
      return NextResponse.json(
        { error: "Almacén no encontrado" },
        { status: 404 },
      );
    }

    const audit: AlmacenAudit = {
      almacen: almacenRaw.data[0],
      cierres: cierresRaw.data.map((item) => {
        const cierre_almacen = item.cierre_almacen.find(
          (cierre) => cierre.almacen === nombre,
        );
        return {
          fecha: item.fecha,
          ajuste_stock: cierre_almacen?.ajuste_stock ?? {
            blancas: 0,
            negras: 0,
            verdes: 0,
          },
          roturas: cierre_almacen?.roturas ?? {
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

export interface AlmacenAudit {
  almacen: Almacen;
  cierres: ({
    fecha: string;
    ajuste_stock: Cajas;
  } & CajasRoturas)[];
}
