import {
  Cajas,
  ItemComparacionEntrega,
  ItemComparacionRecogida,
  TABLAS,
  Tapas,
} from "@/lib/constants";
import { connectToDatabase } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { sameCajas } from "@/lib/utils";
import { usuarioCookie } from "@/lib/auth";
import { getComparacionEntrega, getComparacionRecogida } from "@/lib/compares";

function formatCajas(cajas?: Cajas): string {
  if (!cajas) return "B:0 N:0 V:0";
  return `B:${cajas.blancas ?? 0} N:${cajas.negras ?? 0} V:${cajas.verdes ?? 0}`;
}

function formatTapas(cajas?: Tapas): string {
  if (!cajas) return "B:0 N:0 V:0";
  return `B:${cajas.blancas ?? 0} N:${cajas.negras ?? 0}`;
}

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const fecha = new Date().toISOString().split("T")[0];

    // Get UTC start of today
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    // Get UTC start of tomorrow
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfToday.getUTCDate() + 1);

    const db = await connectToDatabase();

    const [usuariosRecientes, cierreHoy, alertsExpEntRaw, alertsDevRecRaw] =
      await Promise.all([
        db
          .from(TABLAS.USUARIO)
          .select("*", { count: "exact", head: true })
          .or("ajuste->habilitado.neq.true, ajuste->habilitado.is.null")
          .gte("created_at", startOfToday.toISOString())
          .lt("created_at", startOfTomorrow.toISOString()),
        db
          .from(TABLAS.CIERRE)
          .select("*", { count: "exact", head: true })
          .eq("fecha", fecha),
        getComparacionEntrega(db, fecha),
        getComparacionRecogida(db, fecha),
      ]);

    const error = usuariosRecientes.error || cierreHoy.error;

    if (error !== null) throw new Error(error.message);

    const alertsExpEnt: EventAlerta[] = alertsExpEntRaw
      .filter((item: ItemComparacionEntrega) => {
        if (!item.expedicion) {
          return true;
        }
        if (
          item.traspaso &&
          item.entrega &&
          !sameCajas(item.traspaso.cajas, item.entrega.cajas)
        ) {
          return true;
        }
        if (
          item.traspaso &&
          !sameCajas(item.expedicion.cajas, item.traspaso.cajas)
        ) {
          return true;
        }
        return false;
      })
      .map((item: ItemComparacionEntrega): EventAlerta => {
        return {
          tipo: "expedicion_entrega",
          nombre: item.centro_distribucion,
          detalle: `Diferencia en cajas: Expedicion(${formatCajas(
            item.expedicion?.cajas,
          )}) vs Traspaso(${formatCajas(item.traspaso?.cajas)}) vs Entrega(${formatCajas(
            item.entrega?.cajas,
          )})`,
          // data: item,
        };
      });

    const alertsDevRec: EventAlerta[] = alertsDevRecRaw
      .filter((item: ItemComparacionRecogida) => {
        if (!item.recogida) {
          return true;
        }
        if (!item.devolucion) {
          return false;
        }
        if (!sameCajas(item.recogida.cajas, item.devolucion.cajas)) {
          return true;
        }
        if (
          !sameCajas(item.recogida.roturas.cajas, item.devolucion.roturas.cajas)
        ) {
          return true;
        }
        if (
          !sameCajas(item.recogida.roturas.tapas, item.devolucion.roturas.tapas)
        ) {
          return true;
        }
        return false;
      })
      .map((item: ItemComparacionRecogida): EventAlerta => {
        let alertCajas = false;
        let alertRotas = false;
        let alertTapas = false;
        if (item.recogida && item.devolucion) {
          alertCajas = !sameCajas(item.recogida.cajas, item.devolucion.cajas);
          alertRotas = !sameCajas(
            item.recogida.roturas.cajas,
            item.devolucion.roturas.cajas,
          );
          alertTapas = !sameCajas(
            item.recogida.roturas.tapas,
            item.devolucion.roturas.tapas,
          );
        }
        return {
          tipo: "devolucion_recogida",
          nombre: item.centro_distribucion,
          detalle:
            (alertCajas
              ? `Diferencia en cajas: "Recogida cajas(${formatCajas(
                  item.recogida?.cajas,
                )}) vs Devolucion cajas(${formatCajas(item.devolucion?.cajas)})`
              : "") +
            (alertRotas
              ? `${alertCajas ? "\n" : ""}Diferencia en cajas rotas: "Recogida cajas(${formatCajas(
                  item.recogida?.roturas.cajas,
                )}) vs Devolucion cajas(${formatCajas(item.devolucion?.roturas.cajas)})`
              : "") +
            (alertTapas
              ? `${alertCajas || alertRotas ? "\n" : ""}Diferencia en tapas rotas: "Recogida cajas(${formatTapas(
                  item.recogida?.roturas.tapas,
                )}) vs Devolucion cajas(${formatTapas(item.devolucion?.roturas.tapas)})`
              : ""),
        };
      });

    const response: AlertaResponse = {
      total:
        (usuariosRecientes.count ?? 0) +
        alertsExpEnt.length +
        alertsDevRec.length +
        (cierreHoy.count! > 0 ? 0 : 1),
      usuarios_recientes: usuariosRecientes.count ?? 0,
      inconsistencias_expedicion_entrega: alertsExpEnt,
      inconsistencias_devolucion_recogida: alertsDevRec,
      cierre_pendiente: cierreHoy.count === 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error obteniendo alertas:", error);
    return NextResponse.json(
      { error: "Error al obtener alertas" },
      { status: 500 },
    );
  }
}

export interface EventAlerta {
  tipo: string;
  nombre: string;
  detalle: string;
}

export interface AlertaResponse {
  total: number;
  usuarios_recientes: number;
  inconsistencias_expedicion_entrega: EventAlerta[];
  inconsistencias_devolucion_recogida: EventAlerta[];
  cierre_pendiente: boolean;
}
