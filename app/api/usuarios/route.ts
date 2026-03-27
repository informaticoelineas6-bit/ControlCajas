import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, logDelete } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { COLECCIONES, Usuario } from "@/lib/constants";
import { usuarioCookie } from "../../../lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const usuarios = db.collection<Usuario>(COLECCIONES.USUARIO);
    const listaUsuarios = (await usuarios.find({}).toArray()).map((u) => ({
      _id: u._id?.toString(),
      nombre: u.nombre,
      rol: u.rol,
      ajuste: u.ajuste,
    }));
    return NextResponse.json(listaUsuarios);
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

    const body = await request.json();
    const { _id, ...data } = body;
    if (!_id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 },
      );
    }

    if (body.nombre === usuario.nombre) {
      return NextResponse.json(
        { error: "No está permitido modificar el propio usuario" },
        { status: 403 },
      );
    }

    const { db } = await connectToDatabase();
    const usuarios = db.collection(COLECCIONES.USUARIO);
    await usuarios.updateOne(
      { _id: ObjectId.createFromHexString(_id) },
      { $set: data },
    );
    return NextResponse.json({ _id, ...data });
  } catch (error) {
    console.error("Error updating usuario:", error);
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
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const usuarios = db.collection(COLECCIONES.USUARIO);

    return await logDelete(
      db,
      usuarios,
      ObjectId.createFromHexString(id),
      usuario.nombre,
    );
  } catch (error) {
    console.error("Error deleting usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 },
    );
  }
}
