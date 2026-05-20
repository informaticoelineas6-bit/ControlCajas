import { Cierre, TABLAS } from "@/lib/constants";
import { connectToDatabase, getErrorMessage } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { getUsuario } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = await getUsuario(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");

    if (!fecha) {
      return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });
    }

    const db = (await connectToDatabase()).from(TABLAS.CIERRE);
    const { data, error } = await db.select().eq("fecha", fecha);

    if (error) throw new Error(error.message);

    return NextResponse.json(data[0] ?? null);
  } catch (error) {
    console.error("Error al obtener cierre:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await getUsuario(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { fecha, cierre_cd, cierre_almacen }: Cierre = await request.json();

    if (!fecha) {
      return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });
    }

    // Verificar si ya existe un cierre para esta fecha
    const db = (await connectToDatabase()).from(TABLAS.CIERRE);

    const { error } = await db.insert({
      fecha,
      cierre_almacen,
      cierre_cd,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Cierre creado exitosamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error al crear cierre:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
