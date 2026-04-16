import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, LogAudit } from "@/lib/server";
import { TABLAS, Usuario } from "@/lib/constants";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const db = (await connectToDatabase()).from(TABLAS.USUARIO);

    const { data, error } = await db.select("nombre, rol, ajuste");

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
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

    const { nombre, ...body }: Partial<Usuario> = await request.json();

    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre de centro requerido" },
        { status: 400 },
      );
    }

    if (nombre === usuario.nombre) {
      return NextResponse.json(
        { error: "No está permitido modificar el propio usuario" },
        { status: 403 },
      );
    }

    const db = await connectToDatabase();

    const { data, error: fetchError } = await db
      .from(TABLAS.USUARIO)
      .select("*")
      .eq("nombre", nombre);

    if (fetchError) throw new Error(fetchError.message);

    if (data.length === 0) throw new Error("Usuario no encontrada");

    LogAudit(db, "UPDATE", data[0], "Usuario", usuario.nombre, body);

    const { error } = await db
      .from(TABLAS.USUARIO)
      .update({
        rol: body.rol,
        ajuste: body.ajuste,
      })
      .eq("nombre", nombre);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Usuario actualizado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
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
        { error: "Nombre de usuario requerido" },
        { status: 400 },
      );
    }

    if (nombre === usuario.nombre) {
      return NextResponse.json(
        { error: "No está permitido eliminar el propio usuario" },
        { status: 403 },
      );
    }

    const db = await connectToDatabase();

    const { data, error: fetchError } = await db
      .from(TABLAS.USUARIO)
      .select("*")
      .eq("nombre", nombre);

    if (fetchError) throw new Error(fetchError.message);

    if (data.length === 0) throw new Error("Usuario no encontrada");

    LogAudit(db, "DELETE", data[0], "Usuario", usuario.nombre);

    const { error } = await db
      .from(TABLAS.USUARIO)
      .delete()
      .eq("nombre", nombre);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Usuario eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 },
    );
  }
}
