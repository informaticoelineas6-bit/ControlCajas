import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { TABLAS, Vehiculo } from "@/lib/constants";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const db = (await connectToDatabase()).from(TABLAS.VEHICULO);
    const { data, error } = await db.select("*");

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
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

    const body: Vehiculo = await request.json();
    body.chapa = body.chapa.trim();

    const db = (await connectToDatabase()).from(TABLAS.VEHICULO);
    const { error } = await db.insert(body);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Almacén insertado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error insertando vehiculo:", error);
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

    const { chapa, ...updates }: Vehiculo = await request.json();
    if (!chapa) {
      return NextResponse.json(
        { error: "Nombre de almacén requerido" },
        { status: 400 },
      );
    }

    const db = (await connectToDatabase()).from(TABLAS.VEHICULO);
    const { error } = await db.update(updates).eq("chapa", chapa);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Vehículo actualizado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error actualizando vehiculo:", error);
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
    const chapa = searchParams.get("id");
    if (!chapa) {
      return NextResponse.json(
        { error: "Chapa de vehículo requerida" },
        { status: 400 },
      );
    }

    const db = (await connectToDatabase()).from(TABLAS.VEHICULO);
    const { error } = await db.delete().eq("chapa", chapa);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Vehículo eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error eliminando vehiculo:", error);
    return NextResponse.json(
      { error: "Error al eliminar vehículo" },
      { status: 500 },
    );
  }
}
