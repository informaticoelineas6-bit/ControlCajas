import { getErrorMessage } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { getUsuario } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = await getUsuario(request);

    if (!usuario) {
      return NextResponse.json(
        { error: "No estás autenticado" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      usuario,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
