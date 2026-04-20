import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, LogAudit } from "@/lib/server";
import { Almacen, TABLAS } from "@/lib/constants";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const db = (await connectToDatabase()).from(TABLAS.ALMACEN);

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

    const body: Almacen = await request.json();
    body.nombre = body.nombre.trim();

    const db = await connectToDatabase();

    {
      const { count, error } = await db
        .from(TABLAS.ALMACEN)
        .select<string, Almacen>("*", { count: "exact", head: true })
        .eq("nombre", body.nombre);

      if (error) throw new Error(error.message);

      if (count && count > 0) {
        return NextResponse.json(
          { error: "Ya existe un almacén con ese número" },
          { status: 400 },
        );
      }
    }

    LogAudit(db, "INSERT", body, "Almacén", usuario.nombre);

    const { error } = await db.from(TABLAS.ALMACEN).insert(body);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Almacén insertado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creando almacen:", error);
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

    const { nombre, ...body }: Almacen = await request.json();
    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre de almacén requerido" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();

    const { data, error: fetchError } = await db
      .from(TABLAS.ALMACEN)
      .select("*")
      .eq("nombre", nombre);

    if (fetchError) throw new Error(fetchError.message);

    if (data.length === 0) throw new Error("Almacén no encontrado");

    LogAudit(db, "UPDATE", data[0], "Almacén", usuario.nombre, body);

    const { error } = await db
      .from(TABLAS.ALMACEN)
      .update(body)
      .eq("nombre", nombre);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Almacén actualizado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error actualizando almacen:", error);
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
    const nombre = searchParams.get("id");
    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre de almacen requerido" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();

    const { data, error: fetchError } = await db
      .from(TABLAS.ALMACEN)
      .select("*")
      .eq("nombre", nombre);

    if (fetchError) throw new Error(fetchError.message);

    if (data.length === 0) throw new Error("Almacén no encontrado");

    LogAudit(db, "DELETE", data[0], "Almacén", usuario.nombre);

    const { error } = await db
      .from(TABLAS.ALMACEN)
      .delete()
      .eq("nombre", nombre);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Almacén eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error eliminando almacen:", error);
    return NextResponse.json(
      { error: "Error al eliminar almacen" },
      { status: 500 },
    );
  }
}
