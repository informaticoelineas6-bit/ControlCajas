import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  COLECCIONES,
  Devolucion,
  Entrega,
  Expedicion,
  Recogida,
  Traspaso,
} from "@/lib/constants";
import {
  appendNombre,
  applyAjuste,
  sameCajas,
  sumCajas,
  totalCajas,
  userRole,
} from "../utils";

function alertCompare(event1: any, event2: any, event3?: any): boolean {
  if (!event1 || !event2) {
    const existingEvent = event1 || event2;
    if (existingEvent && totalCajas(existingEvent.cajas) === 0) {
      return false; // Falta uno de los eventos, pero no se transportaron cajas.
    } else {
      return true; // Si falta uno de los eventos y se transportaron cajas, marcar alerta.
    }
  } else {
    if (event3) {
      if (!sameCajas(event3.cajas, event2.cajas)) return true;
    }
    // Ambos existen, comparar
    return !sameCajas(event1.cajas, event2.cajas);
  }
}

function alertCompareRotura(event1: any, event2: any): boolean {
  return (
    !sameCajas(event1.cajas_rotas, event2.cajas_rotas) ||
    !sameCajas(event1.tapas_rotas, event2.tapas_rotas)
  );
}

function alertRotura(event1: any, event2: any): boolean {
  return (
    totalCajas(event1?.cajas_rotas) > 0 ||
    totalCajas(event1?.tapas_rotas) > 0 ||
    totalCajas(event2?.cajas_rotas) > 0 ||
    totalCajas(event2?.tapas_rotas) > 0
  );
}

export async function GET(request: NextRequest) {
  try {
    const useRole = userRole(request);
    if (useRole === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (useRole !== "informatico")
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

    const { db } = await connectToDatabase();

    if (tipo === "expedicion_entrega") {
      // Obtener expediciones y entregas
      const expediciones = (
        await db.collection(COLECCIONES.EXPEDICION).find({ fecha }).toArray()
      ).map(applyAjuste) as Expedicion[];

      const entregas = (
        await db.collection(COLECCIONES.ENTREGA).find({ fecha }).toArray()
      ).map(applyAjuste) as Entrega[];

      const traspasos = (
        await db.collection(COLECCIONES.TRASPASO).find({ fecha }).toArray()
      ).map(applyAjuste) as Traspaso[];

      // Agrupar por centro de distribución
      const centrosExp = new Map<string, any>();

      for (const current of expediciones) {
        const centro = current.centro_distribucion;
        if (centrosExp.has(centro)) {
          const item = centrosExp.get(centro);
          item.almacen = appendNombre(item.almacen, current.almacen);
          item.expedicion = {
            nombre: appendNombre(item.expedicion?.nombre, current.nombre),
            cajas: sumCajas(item.expedicion?.cajas, current.cajas),
            ajuste: appendNombre(item.expedicion?.ajuste, current.ajuste),
          };
        } else {
          centrosExp.set(centro, {
            centro_distribucion: centro,
            almacen: current.almacen,
            chapa: null,
            expedicion: {
              nombre: current.nombre,
              cajas: current.cajas,
              ajuste: current.ajuste,
            },
            traspaso: null,
            entrega: null,
            alerta: false,
          });
        }
      }

      for (const current of traspasos) {
        const centro = current.centro_distribucion;
        if (centrosExp.has(centro)) {
          const item = centrosExp.get(centro);
          item.almacen = appendNombre(item.almacen, current.almacen);
          item.chapa = appendNombre(item.chapa, current.chapa);
          item.traspaso = {
            nombre: appendNombre(item.traspaso?.nombre, current.nombre),
            cajas: sumCajas(item.traspaso?.cajas, current.cajas),
            ajuste: appendNombre(item.traspaso?.ajuste, current.ajuste),
          };
        } else {
          centrosExp.set(centro, {
            centro_distribucion: centro,
            almacen: current.almacen,
            chapa: current.chapa,
            expedicion: null,
            traspaso: {
              nombre: current.nombre,
              cajas: current.cajas,
              ajuste: current.ajuste,
            },
            entrega: null,
            alerta: false,
          });
        }
      }

      for (const current of entregas) {
        const centro = current.centro_distribucion;
        if (centrosExp.has(centro)) {
          const item = centrosExp.get(centro);
          item.chapa = appendNombre(item.chapa, current.chapa);
          item.entrega = {
            nombre: appendNombre(item.entrega?.nombre, current.nombre),
            cajas: sumCajas(item.entrega?.cajas, current.cajas),
            ajuste: appendNombre(item.entrega?.ajuste, current.ajuste),
          };
        } else {
          centrosExp.set(centro, {
            centro_distribucion: centro,
            almacen: null,
            chapa: current.chapa,
            expedicion: null,
            traspaso: null,
            entrega: {
              nombre: current.nombre,
              cajas: current.cajas,
              ajuste: current.ajuste || "",
            },
            alerta: true,
          });
        }
      }

      // Verificar inconsistencias
      const resultados = Array.from(centrosExp.values()).map((item) => {
        item.alerta = alertCompare(
          item.expedicion,
          item.entrega,
          item.traspaso,
        );
        return item;
      });

      return NextResponse.json(resultados);
    } else if (tipo === "devolucion_recogida") {
      // Obtener devoluciones y recogidas
      const recogidas = (
        await db.collection(COLECCIONES.RECOGIDA).find({ fecha }).toArray()
      ).map(applyAjuste) as Recogida[];

      const devoluciones = (
        await db.collection(COLECCIONES.DEVOLUCION).find({ fecha }).toArray()
      ).map(applyAjuste) as Devolucion[];

      // Agrupar por centro de distribución
      const centrosRec = new Map<string, any>();

      for (const current of recogidas) {
        const centro = current.centro_distribucion;
        if (centrosRec.has(centro)) {
          const item = centrosRec.get(centro);
          item.chapa = appendNombre(item.chapa, current.chapa);
          item.recogida = {
            nombre: appendNombre(item.recogida?.nombre, current.nombre),
            cajas: sumCajas(item.recogida?.cajas, current.cajas),
            cajas_rotas: sumCajas(
              item.recogida?.cajas_rotas,
              current.cajas_rotas,
            ),
            tapas_rotas: sumCajas(
              item.recogida?.tapas_rotas,
              current.tapas_rotas,
            ),
            ajuste: appendNombre(item.recogida?.ajuste, current.ajuste),
          };
        } else {
          centrosRec.set(centro, {
            centro_distribucion: centro,
            almacen: null,
            chapa: current.chapa,
            recogida: {
              nombre: current.nombre,
              cajas: current.cajas,
              cajas_rotas: current.cajas_rotas,
              tapas_rotas: current.tapas_rotas,
              ajuste: current.ajuste,
            },
            devolucion: null,
            alerta: false,
            rotura: false,
          });
        }
      }

      for (const current of devoluciones) {
        const centro = current.centro_distribucion;
        if (centrosRec.has(centro)) {
          const item = centrosRec.get(centro);
          item.almacen = appendNombre(item.almacen, current.almacen);
          item.devolucion = {
            nombre: appendNombre(item.devolucion?.nombre, current.nombre),
            cajas: sumCajas(item.devolucion?.cajas, current.cajas),
            cajas_rotas: sumCajas(
              item.devolucion?.cajas_rotas,
              current.cajas_rotas,
            ),
            tapas_rotas: sumCajas(
              item.devolucion?.tapas_rotas,
              current.tapas_rotas,
            ),
            ajuste: appendNombre(item.devolucion?.ajuste, current.ajuste),
          };
        } else {
          centrosRec.set(centro, {
            centro_distribucion: centro,
            almacen: current.almacen,
            chapa: null,
            recogida: null,
            devolucion: {
              nombre: current.nombre,
              cajas: current.cajas,
              cajas_rotas: current.cajas_rotas,
              tapas_rotas: current.tapas_rotas,
              ajuste: current.ajuste,
            },
            alerta: false,
            rotura: false,
          });
        }
      }

      // Verificar inconsistencias
      const resultados = Array.from(centrosRec.values()).map((item) => {
        item.alerta =
          alertCompare(item.recogida, item.devolucion) ||
          alertCompareRotura(item.recogida, item.devolucion);
        item.rotura = alertRotura(item.recogida, item.devolucion);
        return item;
      });

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
