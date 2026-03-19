import { Cierre, COLECCIONES } from "@/lib/constants";
import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { usuarioCookie } from "../../../lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");

    if (!fecha) {
      return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const cierre = await db.collection(COLECCIONES.CIERRE).findOne({ fecha });

    if (cierre) {
      return NextResponse.json(cierre);
    } else {
      return NextResponse.json(null);
    }
  } catch (error) {
    console.error("Error al obtener cierre:", error);
    return NextResponse.json(
      { error: "Error al obtener cierre" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const data = await request.json();
    const { fecha, cierre_cd, cierre_almacen } = data;

    if (!fecha) {
      return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });
    }

    // Verificar si ya existe un cierre para esta fecha
    const { db } = await connectToDatabase();
    const cierreExistente = await db
      .collection(COLECCIONES.CIERRE)
      .findOne({ fecha });

    if (cierreExistente) {
      return NextResponse.json(
        { error: "Ya existe un cierre para esta fecha" },
        { status: 409 },
      );
    }

    const nuevoCierre: Cierre = {
      fecha,
      cierre_almacen,
      cierre_cd,
    };

    const resultado = await db
      .collection(COLECCIONES.CIERRE)
      .insertOne(nuevoCierre);

    if (resultado.insertedId) {
      return NextResponse.json(nuevoCierre, { status: 201 });
    } else {
      return NextResponse.json(
        { error: "Error al crear cierre" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error al crear cierre:", error);
    return NextResponse.json(
      { error: "Error al crear cierre" },
      { status: 500 },
    );
  }
}
