import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  CentroDistribucion,
  COLECCIONES,
  Nuevo,
  Provincia,
} from "@/lib/constants";
import { usuarioCookie } from "../../../lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const centros = db.collection(COLECCIONES.CENTRO_DISTRIBUCION);
    const listaCentros = await centros.find({}).toArray();
    return NextResponse.json(listaCentros);
  } catch (error) {
    console.error("Error fetching centros:", error);
    return NextResponse.json(
      { error: "Error al obtener centros" },
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

    const body: Nuevo<CentroDistribucion> = await request.json();
    const { db } = await connectToDatabase();

    body.nombre = body.nombre.trim();
    const centros = db.collection<CentroDistribucion>(
      COLECCIONES.CENTRO_DISTRIBUCION,
    );

    const existente = await centros.findOne({ nombre: body.nombre });
    if (existente) {
      return NextResponse.json(
        { error: "Ya se encuentra registrado un centro con ese nombre" },
        { status: 409 },
      );
    }

    const provincias = db.collection<Provincia>(COLECCIONES.PROVINCIA);
    const provincia = await provincias.findOne({ nombre: body.nombre });
    if (provincia) {
      return NextResponse.json(
        {
          error:
            "Ya se encuentra registrada una provincia asociada a un centro con ese nombre",
        },
        { status: 409 },
      );
    }

    const result = await centros.insertOne(body);
    return NextResponse.json({ _id: result.insertedId, ...body });
  } catch (error) {
    console.error("Error creating centro:", error);
    return NextResponse.json(
      { error: "Error al crear centro" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const body = await request.json();
    const { _id, ...data } = body;
    if (!_id) {
      return NextResponse.json(
        { error: "ID de centro requerido" },
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    const centros = db.collection(COLECCIONES.CENTRO_DISTRIBUCION);
    await centros.updateOne(
      { _id: ObjectId.createFromHexString(_id) },
      { $set: data },
    );
    return NextResponse.json({ _id, ...data });
  } catch (error) {
    console.error("Error updating centro:", error);
    return NextResponse.json(
      { error: "Error al actualizar centro" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID de centro requerido" },
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    const centros = db.collection(COLECCIONES.CENTRO_DISTRIBUCION);
    await centros.deleteOne({ _id: ObjectId.createFromHexString(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting centro:", error);
    return NextResponse.json(
      { error: "Error al eliminar centro" },
      { status: 500 },
    );
  }
}
