import { Cajas, CajasRoturas, CentroDistribucion } from "@/lib/constants";
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

    const { data, error } = await db.rpc(
      "get_centro_audit",
      {
        centro_nombre: nombre,
      },
      { get: true },
    );

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
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
