import {
  AlertaResponse,
  CentroDistribucion,
  DeudaAct,
  EventAlerta,
  TABLAS,
} from "@/lib/constants";
import { connectToDatabase, getErrorMessage } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { formatCajas, formatTapas, sameCajas, totalCajas } from "@/lib/utils";
import { usuarioCookie } from "@/lib/auth";
import {
  getComparacionEntrega,
  getComparacionRecogida,
  ItemComparacionEntrega,
  ItemComparacionRecogida,
} from "@/lib/compares";
import {
  addDays,
  endOfDay,
  format,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const today = new Date();
    const fecha = format(today, "yyyy-MM-dd");

    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const db = await connectToDatabase();

    const [
      usuariosRecientes,
      cierreHoy,
      alertsExpEntRaw,
      alertsDevRecRaw,
      centrosRaw,
    ] = await Promise.all([
      db
        .from(TABLAS.USUARIO)
        .select("*", { count: "exact", head: true })
        .is("habilitado", false)
        .gte("created_at", startOfToday.toISOString())
        .lte("created_at", endOfToday.toISOString()),
      db
        .from(TABLAS.CIERRE)
        .select("*", { count: "exact", head: true })
        .eq("fecha", fecha),
      getComparacionEntrega(db, fecha),
      getComparacionRecogida(db, fecha),
      db.rpc<string, DeudaAct<CentroDistribucion>>("all_centros_deuda_activa"),
    ]);

    const error =
      usuariosRecientes.error || cierreHoy.error || centrosRaw.error;

    if (error !== null) throw new Error(error.message);

    const alertsExpEnt: EventAlerta[] = alertsExpEntRaw
      .filter((item: ItemComparacionEntrega) => item.alerta)
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
      .filter((item: ItemComparacionRecogida) => item.alerta)
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

    let retrasos = 0;
    for (const centro of centrosRaw.data) {
      if (totalCajas(centro.deuda_activa) <= 0 || !centro.fecha_liquidacion)
        continue;

      const fechaLimite = addDays(
        parseISO(centro.fecha_liquidacion),
        centro.rotacion ?? 0,
      );

      if (isBefore(fechaLimite, today)) {
        retrasos++;
      }
    }

    const response: AlertaResponse = {
      total:
        (usuariosRecientes.count ?? 0) +
        (retrasos > 0 ? 1 : 0) +
        alertsExpEnt.length +
        alertsDevRec.length +
        (cierreHoy.count === 0 ? 1 : 0),
      usuarios_recientes: usuariosRecientes.count ?? 0,
      centros_retrasados: retrasos,
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
