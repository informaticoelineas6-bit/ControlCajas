import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { ROLES_ARRAY, TABLAS, Usuario } from "@/lib/constants";
import { connectToDatabase } from "@/lib/server";

export async function POST(request: NextRequest) {
  try {
    const { nombre: nombreRaw, contrasena, rol } = await request.json();

    const nombre = nombreRaw.trim();

    if (!nombre || !contrasena || !rol) {
      return NextResponse.json(
        { error: "Nombre, contraseña y rol son requeridos" },
        { status: 400 },
      );
    }

    if (!ROLES_ARRAY.includes(rol)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    const db = (await connectToDatabase()).from(TABLAS.USUARIO);

    {
      const { count, error } = await db
        .select<string, Usuario>("*")
        .eq("nombre", nombre);

      if (error) throw new Error(error.message);

      if (count && count > 0) {
        return NextResponse.json(
          { error: "Ya existe un usuario con ese nombre" },
          { status: 400 },
        );
      }
    }

    const hashedPassword = await hashPassword(contrasena);

    const { error } = await db.insert({
      nombre,
      rol,
      contrasena: hashedPassword,
    });

    if (error) throw new Error(error.message);

    const response = NextResponse.json(
      {
        success: true,
        message:
          "Su usuario ha sido creado exitosamente, póngase en contacto con un administrador del sistema para su autorización",
      },
      { status: 201 },
    );

    return response;
  } catch (error) {
    console.error("Registro error:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 },
    );
  }
}
