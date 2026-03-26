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
    const provincias = db.collection(COLECCIONES.PROVINCIA);
    const listaProvincias = await provincias.find({}).toArray();
    return NextResponse.json(listaProvincias);
  } catch (error) {
    console.error("Error fetching almacenes:", error);
    return NextResponse.json(
      { error: "Error al obtener almacenes" },
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

    const body: Nuevo<Provincia> = await request.json();
    const { db } = await connectToDatabase();

    body.nombre = body.nombre.trim();
    const provincias = db.collection<Provincia>(COLECCIONES.PROVINCIA);

    const existente = await provincias.findOne({ nombre: body.nombre });
    if (existente) {
      return NextResponse.json(
        { error: "Ya se encuentra registrada una provincia con ese nombre" },
        { status: 409 },
      );
    }

    const centros = db.collection<CentroDistribucion>(
      COLECCIONES.CENTRO_DISTRIBUCION,
    );
    const centro = await centros.findOne({ nombre: body.nombre });
    if (centro) {
      return NextResponse.json(
        { error: "Ya se encuentra registrado un centro con ese nombre" },
        { status: 409 },
      );
    }

    const result = await provincias.insertOne(body);
    return NextResponse.json({ _id: result.insertedId, ...body });
  } catch (error) {
    console.error("Error creating provincia:", error);
    return NextResponse.json(
      { error: "Error al crear provincia" },
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
        { error: "ID de provincia requerido" },
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    const provincias = db.collection(COLECCIONES.PROVINCIA);
    await provincias.updateOne(
      { _id: ObjectId.createFromHexString(_id) },
      { $set: data },
    );
    return NextResponse.json({ _id, ...data });
  } catch (error) {
    console.error("Error updating provincia:", error);
    return NextResponse.json(
      { error: "Error al actualizar provincia" },
      { status: 500 },
    );
  }
}
