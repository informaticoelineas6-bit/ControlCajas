import { AlertaResponse, EventAlerta, TABLAS } from "@/lib/constants";
import { connectToDatabase, getErrorMessage } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { formatCajas, formatTapas, sameCajas } from "@/lib/utils";
import { usuarioCookie } from "@/lib/auth";
import {
  getComparacionEntrega,
  getComparacionRecogida,
  ItemComparacionEntrega,
  ItemComparacionRecogida,
} from "@/lib/compares";
import { endOfDay, format, startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const fecha = format(new Date(), "yyyy-MM-dd");

    const startOfToday = startOfDay(new Date());
    const endOfToday = endOfDay(new Date());

    const db = await connectToDatabase();

    const [usuariosRecientes, cierreHoy, alertsExpEntRaw, alertsDevRecRaw] =
      await Promise.all([
        db
          .from(TABLAS.USUARIO)
          .select("*", { count: "exact", head: true })
          .or("ajuste->habilitado.neq.true, ajuste->habilitado.is.null")
          .gte("created_at", startOfToday.toISOString())
          .lte("created_at", endOfToday.toISOString()),
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
          detalle: `Diferencia en cajas: Expedicion(${
            item.expedicion
              ? formatCajas(item.expedicion.cajas, {
                  fullName: false,
                  separator: " ",
                })
              : "sin cajas"
          }) vs Traspaso(${item.traspaso ? formatCajas(item.traspaso.cajas, { fullName: false, separator: " " }) : "sin cajas"}) vs Entrega(${
            item.entrega
              ? formatCajas(item.entrega.cajas, {
                  fullName: false,
                  separator: " ",
                })
              : "sin cajas"
          })`,
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
              ? `Diferencia en cajas: Recogida(${
                  item.recogida
                    ? formatCajas(item.recogida.cajas, {
                        fullName: false,
                        separator: " ",
                      })
                    : "sin cajas"
                }) vs Devolucion(${
                  item.devolucion
                    ? formatCajas(item.devolucion.cajas, {
                        fullName: false,
                        separator: " ",
                      })
                    : "sin cajas"
                })`
              : "") +
            (alertRotas
              ? `${alertCajas ? "\n" : ""}Diferencia en cajas rotas: Recogida(${
                  item.recogida
                    ? formatCajas(item.recogida.roturas.cajas, {
                        fullName: false,
                        separator: " ",
                      })
                    : "sin cajas"
                }) vs Devolucion(${item.devolucion ? formatCajas(item.devolucion.roturas.cajas, { fullName: false, separator: " " }) : "sin cajas"})`
              : "") +
            (alertTapas
              ? `${alertCajas || alertRotas ? "\n" : ""}Diferencia en tapas rotas: "Recogida(${
                  item.recogida
                    ? formatTapas(item.recogida.roturas.tapas, {
                        fullName: false,
                        separator: " ",
                      })
                    : "sin tapas"
                }) vs Devolucion(${item.devolucion ? formatTapas(item.devolucion.roturas.tapas, { fullName: false, separator: " " }) : "sin cajas"})`
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
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
