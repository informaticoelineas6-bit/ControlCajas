import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, getErrorMessage } from "@/lib/server";
import { usuarioCookie } from "@/lib/auth";
import {
  getComparacionEntrega,
  getComparacionRecogida,
  ItemComparacionEntrega,
  ItemComparacionRecogida,
} from "@/lib/compares";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");
    const tipo = searchParams.get("tipo"); // 'expedicion_entrega' o 'devolucion_recogida'

    if (!tipo) {
      return NextResponse.json(
        { error: "Fecha y tipo son requeridos" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();

    if (tipo === "expedicion_entrega") {
      if (!fecha) {
        return NextResponse.json(
          { error: "Fecha y tipo son requeridos" },
          { status: 400 },
        );
      }

      const resultados: ItemComparacionEntrega[] = (
        await getComparacionEntrega(db, fecha)
      ).sort((a, b) =>
        a.centro_distribucion.localeCompare(b.centro_distribucion),
      );

      return NextResponse.json(resultados);
    } else if (tipo === "devolucion_recogida") {
      const resultados: ItemComparacionRecogida[] = (
        await getComparacionRecogida(db, fecha || null)
      ).sort((a, b) =>
        a.centro_distribucion.localeCompare(b.centro_distribucion),
      );

      return NextResponse.json(resultados);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error comparing events:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
