import { connectToDatabase, getErrorMessage } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { usuarioCookie } from "@/lib/auth";
import {
  Cajas,
  CajasRoturas,
  Devolucion,
  Expedicion,
  TABLAS,
} from "@/lib/constants";
import { AjusteStr, applyAjuste, hasCajas } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");

    if (!fecha) {
      return NextResponse.json(
        { error: "Fecha y tipo son requeridos" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();

    const stockMap: Record<string, { cajas: Cajas } & CajasRoturas> = {};
    const deudaMap: Record<string, { cajas: Cajas } & CajasRoturas> = {};

    const [devolucionRaw, expedicionRaw] = await Promise.all([
      db.from(TABLAS.DEVOLUCION).select("*").is("fecha_cierre", null),
      db.from(TABLAS.EXPEDICION).select("*").eq("fecha", fecha),
    ]);

    const error = devolucionRaw.error || expedicionRaw.error;

    if (error) throw new Error(error.message);

    const [devolucionData, expedicionData] = [
      devolucionRaw
        ? (devolucionRaw.data
            .map(applyAjuste)
            .filter(hasCajas) as AjusteStr<Devolucion>[])
        : [],
      expedicionRaw
        ? (expedicionRaw.data
            .map(applyAjuste)
            .filter(hasCajas) as AjusteStr<Expedicion>[])
        : [],
    ];

    devolucionData.forEach((item: AjusteStr<Devolucion>) => {
      if (!deudaMap[item.centro_distribucion]) {
        deudaMap[item.centro_distribucion] = {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          roturas: {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            tapas: { blancas: 0, negras: 0 },
          },
        };
      }

      deudaMap[item.centro_distribucion].cajas.blancas -=
        item.cajas.blancas ?? 0;
      deudaMap[item.centro_distribucion].cajas.negras -= item.cajas.negras ?? 0;
      deudaMap[item.centro_distribucion].cajas.verdes -= item.cajas.verdes ?? 0;

      deudaMap[item.centro_distribucion].roturas.cajas.blancas +=
        item.roturas.cajas.blancas ?? 0;
      deudaMap[item.centro_distribucion].roturas.cajas.negras +=
        item.roturas.cajas.negras ?? 0;
      deudaMap[item.centro_distribucion].roturas.cajas.verdes +=
        item.roturas.cajas.verdes ?? 0;
      deudaMap[item.centro_distribucion].roturas.tapas.blancas +=
        item.roturas.tapas.blancas ?? 0;
      deudaMap[item.centro_distribucion].roturas.tapas.negras +=
        item.roturas.tapas.negras ?? 0;

      if (!stockMap[item.almacen]) {
        stockMap[item.almacen] = {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          roturas: {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            tapas: { blancas: 0, negras: 0 },
          },
        };
      }
      stockMap[item.almacen].cajas.blancas += item.cajas.blancas ?? 0;
      stockMap[item.almacen].cajas.negras += item.cajas.negras ?? 0;
      stockMap[item.almacen].cajas.verdes += item.cajas.verdes ?? 0;

      stockMap[item.almacen].roturas.cajas.blancas +=
        item.roturas.cajas.blancas ?? 0;
      stockMap[item.almacen].roturas.cajas.negras +=
        item.roturas.cajas.negras ?? 0;
      stockMap[item.almacen].roturas.cajas.verdes +=
        item.roturas.cajas.verdes ?? 0;
      stockMap[item.almacen].roturas.tapas.blancas +=
        item.roturas.tapas.blancas ?? 0;
      stockMap[item.almacen].roturas.tapas.negras +=
        item.roturas.tapas.negras ?? 0;
    });

    expedicionData.forEach((item: AjusteStr<Expedicion>) => {
      if (!stockMap[item.almacen]) {
        stockMap[item.almacen] = {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          roturas: {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            tapas: { blancas: 0, negras: 0 },
          },
        };
      }
      stockMap[item.almacen].cajas.blancas -= item.cajas.blancas ?? 0;
      stockMap[item.almacen].cajas.negras -= item.cajas.negras ?? 0;
      stockMap[item.almacen].cajas.verdes -= item.cajas.verdes ?? 0;

      if (!deudaMap[item.centro_distribucion]) {
        deudaMap[item.centro_distribucion] = {
          cajas: { blancas: 0, negras: 0, verdes: 0 },
          roturas: {
            cajas: { blancas: 0, negras: 0, verdes: 0 },
            tapas: { blancas: 0, negras: 0 },
          },
        };
      }
      deudaMap[item.centro_distribucion].cajas.blancas +=
        item.cajas.blancas ?? 0;
      deudaMap[item.centro_distribucion].cajas.negras += item.cajas.negras ?? 0;
      deudaMap[item.centro_distribucion].cajas.verdes += item.cajas.verdes ?? 0;
    });

    return NextResponse.json({ deudaMap, stockMap });
  } catch (error) {
    console.error("Error ajustando objeto:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
