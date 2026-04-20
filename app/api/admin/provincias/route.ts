import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, LogAudit } from "@/lib/server";
import { Provincia, TABLAS } from "@/lib/constants";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const db = (await connectToDatabase()).from(TABLAS.PROVINCIA);

    const { data, error } = await db.select("*").order("nombre");

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
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

    const body: Provincia = await request.json();
    body.nombre = body.nombre.trim();

    const db = await connectToDatabase();

    const provincias = db.from(TABLAS.PROVINCIA);

    const [provinciaRaw, centroRaw] = await Promise.all([
      provincias
        .select("*", { count: "exact", head: true })
        .eq("nombre", body.nombre),
      db
        .from(TABLAS.CENTRO_DISTRIBUCION)
        .select("*", { count: "exact", head: true })
        .eq("nombre", body.nombre),
    ]);

    const errorRaw = centroRaw.error || provinciaRaw.error;

    if (errorRaw) throw new Error(errorRaw.message);

    if (centroRaw.count && centroRaw.count > 0) {
      return NextResponse.json(
        { error: "Ya se encuentra registrado un centro con ese nombre" },
        { status: 409 },
      );
    }

    if (provinciaRaw.count && provinciaRaw.count > 0) {
      return NextResponse.json(
        {
          error: "Ya se encuentra registrada una provincia con ese nombre",
        },
        { status: 409 },
      );
    }

    LogAudit(db, "INSERT", body, "Provincia", usuario.nombre);

    const { error } = await provincias.insert(body);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Provincia insertada correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error insertando provincia:", error);
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

    const { nombre, ...body } = await request.json();

    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre de provincia requerido" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();

    const { data, error: fetchError } = await db
      .from(TABLAS.PROVINCIA)
      .select("*")
      .eq("nombre", nombre);

    if (fetchError) throw new Error(fetchError.message);

    if (data.length === 0) throw new Error("Provincia no encontrada");

    LogAudit(db, "UPDATE", data[0], "Provincia", usuario.nombre, body);

    const { error } = await db
      .from(TABLAS.PROVINCIA)
      .update(body)
      .eq("nombre", nombre);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Provincia actualizada correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error actualizando provincia:", error);
    return NextResponse.json(
      { error: "Error al actualizar provincia" },
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
    const nombre = searchParams.get("id");
    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre de provincia requerido" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();

    const { data, error: fetchError } = await db
      .from(TABLAS.PROVINCIA)
      .select("*")
      .eq("nombre", nombre);

    if (fetchError) throw new Error(fetchError.message);

    if (data.length === 0) throw new Error("Provincia no encontrada");

    LogAudit(db, "DELETE", data[0], "Provincia", usuario.nombre);

    const { error } = await db
      .from(TABLAS.PROVINCIA)
      .delete()
      .eq("nombre", nombre);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Provincia eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error eliminando provincia:", error);
    return NextResponse.json(
      { error: "Error al eliminar provincia" },
      { status: 500 },
    );
  }
}
