import {
  Cajas,
  COLECCIONES,
  ItemComparacionEntrega,
  ItemComparacionRecogida,
  Tapas,
} from "@/lib/constants";
import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { sameCajas, usuarioCookie } from "../../../lib/utils";
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

    const { db } = await connectToDatabase();

    const usuariosRecientes: number = (
      await db
        .collection(COLECCIONES.USUARIO)
        .find({ creacion: fecha, habilitado: false })
        .toArray()
    ).length;

    const cierreHoy: boolean = !!(await db
      .collection(COLECCIONES.CIERRE)
      .findOne({ fecha }));

    const alertsExpEnt: EventAlerta[] = (await getComparacionEntrega(db, fecha))
      .filter((item) => {
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

    const alertsDevRec: EventAlerta[] = (
      await getComparacionRecogida(db, fecha)
    )
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
          !sameCajas(item.recogida.cajas_rotas, item.devolucion.cajas_rotas)
        ) {
          return true;
        }
        if (!sameCajas(item.recogida.tapas_rotas, item.recogida.tapas_rotas)) {
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
            item.recogida.cajas_rotas,
            item.devolucion.cajas_rotas,
          );
          alertTapas = !sameCajas(
            item.recogida.tapas_rotas,
            item.devolucion.tapas_rotas,
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
                  item.recogida?.cajas_rotas,
                )}) vs Devolucion cajas(${formatCajas(item.devolucion?.cajas_rotas)})`
              : "") +
            (alertTapas
              ? `${alertCajas || alertRotas ? "\n" : ""}Diferencia en tapas rotas: "Recogida cajas(${formatTapas(
                  item.recogida?.tapas_rotas,
                )}) vs Devolucion cajas(${formatTapas(item.devolucion?.tapas_rotas)})`
              : ""),
        };
      });

    const response: AlertaResponse = {
      total:
        usuariosRecientes +
        alertsExpEnt.length +
        alertsDevRec.length +
        (cierreHoy ? 0 : 1),
      usuarios_recientes: usuariosRecientes,
      inconsistencias_expedicion_entrega: alertsExpEnt,
      inconsistencias_devolucion_recogida: alertsDevRec,
      cierre_pendiente: !cierreHoy,
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
