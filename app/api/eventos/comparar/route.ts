import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import {
  ItemComparacionEntrega,
  ItemComparacionRecogida,
} from "@/lib/constants";
import { sameCajas } from "@/lib/utils";
import { usuarioCookie } from "@/lib/auth";
import { getComparacionEntrega, getComparacionRecogida } from "@/lib/compares";

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

    if (!fecha || !tipo) {
      return NextResponse.json(
        { error: "Fecha y tipo son requeridos" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();

    if (tipo === "expedicion_entrega") {
      const resultados: ItemComparacionEntrega[] = (
        await getComparacionEntrega(db, fecha)
      )
        .map((item: ItemComparacionEntrega): ItemComparacionEntrega => {
          item.alerta =
            !item.expedicion ||
            !item.traspaso ||
            !item.entrega ||
            !sameCajas(item.expedicion.cajas, item.traspaso.cajas) ||
            !sameCajas(item.traspaso.cajas, item.entrega.cajas);
          return item;
        })
        .sort((a, b) =>
          a.centro_distribucion.localeCompare(b.centro_distribucion),
        );

      return NextResponse.json(resultados);
    } else if (tipo === "devolucion_recogida") {
      const resultados: ItemComparacionRecogida[] = (
        await getComparacionRecogida(db, fecha)
      )
        .map((item: ItemComparacionRecogida): ItemComparacionRecogida => {
          item.alerta =
            !item.recogida ||
            !item.devolucion ||
            !sameCajas(item.recogida.cajas, item.devolucion.cajas) ||
            !sameCajas(
              item.recogida.roturas.cajas,
              item.devolucion.roturas.cajas,
            ) ||
            !sameCajas(
              item.recogida.roturas.tapas,
              item.devolucion.roturas.tapas,
            );
          return item;
        })
        .sort((a, b) =>
          a.centro_distribucion.localeCompare(b.centro_distribucion),
        );

      return NextResponse.json(resultados);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error comparing events:", error);
    return NextResponse.json(
      { error: "Error al comparar eventos" },
      { status: 500 },
    );
  }
}
