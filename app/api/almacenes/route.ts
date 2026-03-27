import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, logDelete } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Almacen, COLECCIONES, Nuevo } from "@/lib/constants";
import { usuarioCookie } from "../../../lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const almacenes = db.collection(COLECCIONES.ALMACEN);
    const listaAlmacenes = await almacenes.find({}).toArray();
    return NextResponse.json(listaAlmacenes);
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

    const body: Nuevo<Almacen> = await request.json();
    const { db } = await connectToDatabase();

    body.nombre = body.nombre.trim();
    const almacenes = db.collection<Almacen>(COLECCIONES.ALMACEN);

    const existente = await almacenes.findOne({ nombre: body.nombre });
    if (existente) {
      return NextResponse.json(
        { error: "Ya se encuentra registrado un almacén con ese nombre" },
        { status: 409 },
      );
    }

    const result = await almacenes.insertOne(body);
    return NextResponse.json({ _id: result.insertedId, ...body });
  } catch (error) {
    console.error("Error creating almacen:", error);
    return NextResponse.json(
      { error: "Error al crear almacen" },
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
        { error: "ID de almacen requerido" },
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    const almacenes = db.collection(COLECCIONES.ALMACEN);
    await almacenes.updateOne(
      { _id: ObjectId.createFromHexString(_id) },
      { $set: data },
    );
    return NextResponse.json({ _id, ...data });
  } catch (error) {
    console.error("Error updating almacen:", error);
    return NextResponse.json(
      { error: "Error al actualizar almacen" },
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
        { error: "ID de almacen requerido" },
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    const almacenes = db.collection(COLECCIONES.ALMACEN);

    return await logDelete(
      db,
      almacenes,
      ObjectId.createFromHexString(id),
      usuario.nombre,
    );
  } catch (error) {
    console.error("Error deleting almacen:", error);
    return NextResponse.json(
      { error: "Error al eliminar almacen" },
      { status: 500 },
    );
  }
}
