import { formatName } from "@/lib/utils";
import { connectToDatabase, getErrorMessage } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { comparePassword } from "@/lib/auth";
import { TABLAS, Usuario } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { nombre: nombreRaw, contrasena } = await request.json();

    const nombre = formatName(nombreRaw);

    if (!nombre || !contrasena) {
      return NextResponse.json(
        { error: "Nombre y contraseña son requeridos" },
        { status: 400 },
      );
    }

    const db = (await connectToDatabase()).from(TABLAS.USUARIO);

    const { data, error } = await db
      .select<string, Usuario>("*")
      .eq("nombre", nombre);

    if (error) throw new Error(error.message);

    const usuario = data[0];

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no registrado en el sistema" },
        { status: 401 },
      );
    }

    if (!usuario.habilitado) {
      return NextResponse.json(
        {
          error:
            "Su usuario aún no ha sido autorizado, póngase en contacto con un administrador del sistema",
        },
        { status: 403 },
      );
    }

    const passwordMatch = await comparePassword(
      contrasena,
      usuario.contrasena!,
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      usuario: {
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });

    response.cookies.set(
      "usuario",
      JSON.stringify({
        nombre: usuario.nombre,
        rol: usuario.rol,
      }),
      {
        httpOnly: true,
        maxAge: 86400,
        path: "/",
      },
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
