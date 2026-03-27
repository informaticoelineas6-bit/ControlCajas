import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, logDelete } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { COLECCIONES, Nuevo, Vehiculo } from "@/lib/constants";
import { usuarioCookie } from "../../../lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const vehiculos = db.collection(COLECCIONES.VEHICULO);
    const listaVehiculos = await vehiculos.find({}).toArray();
    return NextResponse.json(listaVehiculos);
  } catch (error) {
    console.error("Error fetching vehiculos:", error);
    return NextResponse.json(
      { error: "Error al obtener vehículos" },
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

    const body: Nuevo<Vehiculo> = await request.json();
    const { db } = await connectToDatabase();

    body.chapa = body.chapa.trim();
    const vehiculos = db.collection<Vehiculo>(COLECCIONES.VEHICULO);

    const existente = await vehiculos.findOne({ chapa: body.chapa });
    if (existente) {
      return NextResponse.json(
        { error: "Ya se encuentra registrado un vehículo con esa matrícula" },
        { status: 409 },
      );
    }

    const result = await vehiculos.insertOne(body);
    return NextResponse.json({ _id: result.insertedId, ...body });
  } catch (error) {
    console.error("Error creating vehiculo:", error);
    return NextResponse.json(
      { error: "Error al crear vehículo" },
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
        { error: "ID de vehículo requerido" },
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    const vehiculos = db.collection(COLECCIONES.VEHICULO);
    await vehiculos.updateOne(
      { _id: ObjectId.createFromHexString(_id) },
      { $set: data },
    );
    return NextResponse.json({ _id, ...data });
  } catch (error) {
    console.error("Error updating vehiculo:", error);
    return NextResponse.json(
      { error: "Error al actualizar vehículo" },
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
        { error: "ID de vehículo requerido" },
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    const vehiculos = db.collection(COLECCIONES.VEHICULO);

    return await logDelete(
      db,
      vehiculos,
      ObjectId.createFromHexString(id),
      usuario.nombre,
    );
  } catch (error) {
    console.error("Error deleting vehiculo:", error);
    return NextResponse.json(
      { error: "Error al eliminar vehículo" },
      { status: 500 },
    );
  }
}
