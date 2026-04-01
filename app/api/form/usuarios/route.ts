import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { COLECCIONES, Usuario } from "@/lib/constants";
import { isEnabled, usuarioCookie } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const usuarios = db.collection<Usuario>(COLECCIONES.USUARIO);
    const listaUsuarios = (await usuarios.find({}).toArray()).filter(isEnabled);
    return NextResponse.json(
      listaUsuarios.map((usr): Usuario => {
        return {
          nombre: usr.nombre,
          rol: usr.rol,
        };
      }),
    );
  } catch (error) {
    console.error("Error fetching usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 },
    );
  }
}
