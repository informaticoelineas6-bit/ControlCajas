import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import { COLECCIONES, Nuevo, ROLES_ARRAY, Usuario } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { nombre: nombreRaw, contrasena, rol } = await request.json();

    const nombre = nombreRaw.trim();

    console.log(nombreRaw);

    if (!nombre || !contrasena || !rol) {
      return NextResponse.json(
        { error: "Nombre, contraseña y rol son requeridos" },
        { status: 400 },
      );
    }

    if (!ROLES_ARRAY.includes(rol)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const usuarios = db.collection<Usuario>(COLECCIONES.USUARIO);

    const usuarioExistente = await usuarios.findOne({ nombre });
    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese nombre" },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(contrasena);

    await usuarios.insertOne({
      nombre,
      contrasena: hashedPassword,
      rol,
      creacion: new Date().toISOString().split("T")[0],
    } as Nuevo<Usuario>);

    const response = NextResponse.json({
      message:
        "Su usuario ha sido creado exitosamente, póngase en contacto con un administrador del sistema para su autorización",
      success: true,
    });

    return response;
  } catch (error) {
    console.error("Registro error:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 },
    );
  }
}
