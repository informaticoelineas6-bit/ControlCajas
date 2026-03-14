import { Cajas, COLECCIONES } from "@/lib/constants";
import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { applyAjuste, sameCajas, sumCajas, userRole } from "../utils";

function alertCompareCajas(event1: any, event2: any, event3?: any): boolean {
  if (event3) {
    if (!sameCajas(event2.cajas, event3.cajas)) {
      return true;
    }
  }
  if (event2) {
    if (!sameCajas(event1.cajas, event2.cajas)) return true;
  }
  return false;
}

function alertCompareRoturaCajas(event1: any, event2: any): boolean {
  if (event2) return !sameCajas(event1.cajas_rotas, event2.cajas_rotas);
  else return false;
}

function alertCompareRoturaTapas(event1: any, event2: any): boolean {
  if (event2) return !sameCajas(event1.tapas_rotas, event2.tapas_rotas);
  else return false;
}

function formatCajas(cajas?: Cajas): string {
  if (!cajas) return "B:0 N:0 V:0";
  return `B:${cajas.blancas ?? 0} N:${cajas.negras ?? 0} V:${cajas.verdes ?? 0}`;
}

async function getExpedicionEntregaAlerts(db: any, fecha: string) {
  const expediciones = (
    await db.collection(COLECCIONES.EXPEDICION).find({ fecha }).toArray()
  ).map(applyAjuste);
  const entregas = (
    await db.collection(COLECCIONES.ENTREGA).find({ fecha }).toArray()
  ).map(applyAjuste);
  const traspasos = (
    await db.collection(COLECCIONES.TRASPASO).find({ fecha }).toArray()
  ).map(applyAjuste);

  const centrosExp = new Map<string, any>();

  for (const current of expediciones) {
    const centro = current.centro_distribucion;
    if (centrosExp.has(centro)) {
      const item = centrosExp.get(centro);
      item.expedicion = {
        cajas: sumCajas(item.expedicion?.cajas, current.cajas),
      };
    } else {
      centrosExp.set(centro, {
        centro_distribucion: centro,
        expedicion: {
          nombre: current.nombre,
          cajas: current.cajas,
          ajuste: current.ajuste,
        },
        traspaso: null,
        entrega: null,
      });
    }
  }

  for (const current of traspasos) {
    const centro = current.centro_distribucion;
    if (centrosExp.has(centro)) {
      const item = centrosExp.get(centro);
      item.traspaso = {
        cajas: sumCajas(item.traspaso?.cajas, current.cajas),
      };
    } else {
      centrosExp.set(centro, {
        centro_distribucion: centro,
        expedicion: null,
        traspaso: {
          nombre: current.nombre,
          cajas: current.cajas,
          ajuste: current.ajuste,
        },
        entrega: null,
      });
    }
  }

  for (const current of entregas) {
    const centro = current.centro_distribucion;
    if (centrosExp.has(centro)) {
      const item = centrosExp.get(centro);
      item.entrega = {
        cajas: sumCajas(item.entrega?.cajas, current.cajas),
      };
    } else {
      centrosExp.set(centro, {
        centro_distribucion: centro,
        expedicion: null,
        traspaso: null,
        entrega: {
          cajas: current.cajas,
        },
      });
    }
  }

  return Array.from(centrosExp.values())
    .filter((item) =>
      alertCompareCajas(item.expedicion, item.entrega, item.traspaso),
    )
    .map((item) => ({
      tipo: "expedicion_entrega",
      centro_distribucion: item.centro_distribucion,
      detalle: `Diferencia en cajas: Expedicion(${formatCajas(
        item.expedicion?.cajas,
      )}) vs Traspaso(${formatCajas(item.traspaso?.cajas)}) vs Entrega(${formatCajas(
        item.entrega?.cajas,
      )})`,
      // data: item,
    }));
}

async function getDevolucionRecogidaAlerts(db: any, fecha: string) {
  const recogidas = (
    await db.collection(COLECCIONES.RECOGIDA).find({ fecha }).toArray()
  ).map(applyAjuste);
  const devoluciones = (
    await db.collection(COLECCIONES.DEVOLUCION).find({ fecha }).toArray()
  ).map(applyAjuste);

  const centrosRec = new Map<string, any>();

  for (const current of recogidas) {
    const centro = current.centro_distribucion;
    if (centrosRec.has(centro)) {
      const item = centrosRec.get(centro);
      item.recogida = {
        cajas: sumCajas(item.recogida?.cajas, current.cajas),
        cajas_rotas: sumCajas(item.recogida?.cajas_rotas, current.cajas_rotas),
        tapas_rotas: sumCajas(item.recogida?.tapas_rotas, current.tapas_rotas),
      };
    } else {
      centrosRec.set(centro, {
        centro_distribucion: centro,
        recogida: {
          cajas: current.cajas,
          cajas_rotas: current.cajas_rotas,
          tapas_rotas: current.tapas_rotas,
        },
        devolucion: null,
      });
    }
  }

  for (const current of devoluciones) {
    const centro = current.centro_distribucion;
    if (centrosRec.has(centro)) {
      const item = centrosRec.get(centro);
      item.devolucion = {
        cajas: sumCajas(item.devolucion?.cajas, current.cajas),
        cajas_rotas: sumCajas(
          item.devolucion?.cajas_rotas,
          current.cajas_rotas,
        ),
        tapas_rotas: sumCajas(
          item.devolucion?.tapas_rotas,
          current.tapas_rotas,
        ),
      };
    } else {
      centrosRec.set(centro, {
        centro_distribucion: centro,
        recogida: null,
        devolucion: {
          cajas: current.cajas,
          cajas_rotas: current.cajas_rotas,
          tapas_rotas: current.tapas_rotas,
        },
      });
    }
  }

  return Array.from(centrosRec.values())
    .filter(
      (item) =>
        alertCompareCajas(item.recogida, item.devolucion) ||
        alertCompareRoturaCajas(item.recogida, item.devolucion) ||
        alertCompareRoturaTapas(item.recogida, item.devolucion),
    )
    .map((item) => {
      const alertCajas = alertCompareCajas(item.recogida, item.devolucion);
      const alertRotas = alertCompareRoturaCajas(
        item.recogida,
        item.devolucion,
      );
      const alertTapas = alertCompareRoturaTapas(
        item.recogida,
        item.devolucion,
      );
      return {
        tipo: "devolucion_recogida",
        centro_distribucion: item.centro_distribucion,
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
            ? `${alertCajas || alertRotas ? "\n" : ""}Diferencia en tapas rotas: "Recogida cajas(${formatCajas(
                item.recogida?.tapas_rotas,
              )}) vs Devolucion cajas(${formatCajas(item.devolucion?.tapas_rotas)})`
            : ""),
        // data: item,
      };
    });
}

export async function GET(request: NextRequest) {
  try {
    const useRole = userRole(request);
    if (useRole === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (useRole !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const fecha = new Date().toISOString().split("T")[0];

    const { db } = await connectToDatabase();

    const [usuariosRecientes, cierreHoy, alertsExpEnt, alertsDevRec] =
      await Promise.all([
        db
          .collection(COLECCIONES.USUARIO)
          .find({ creacion: fecha, habilitado: false })
          .toArray(),
        db.collection(COLECCIONES.CIERRE).findOne({ fecha }),
        getExpedicionEntregaAlerts(db, fecha),
        getDevolucionRecogidaAlerts(db, fecha),
      ]);

    // const alertasUsuarios = usuariosRecientes.map((usuario: any) => ({
    //   tipo: "usuario_reciente",
    //   detalle: `Usuario creado hoy: ${usuario.nombre} (${usuario.rol})`,
    //   data: usuario,
    // }));

    // const alertaCierre = cierreHoy
    //   ? []
    //   : [
    //       {
    //         tipo: "cierre_pendiente",
    //         detalle: `No existe cierre para la fecha ${fecha}`,
    //         data: { fecha },
    //       },
    //     ];

    // const alertas = [
    //   ...alertasUsuarios,
    //   ...alertsExpEnt,
    //   ...alertsDevRec,
    //   ...alertaCierre,
    // ];

    return NextResponse.json({
      total:
        usuariosRecientes.length +
        alertsExpEnt.length +
        alertsDevRec.length +
        (cierreHoy ? 0 : 1),
      usuarios_recientes: usuariosRecientes.length,
      inconsistencias_expedicion_entrega: alertsExpEnt,
      inconsistencias_devolucion_recogida: alertsDevRec,
      cierre_pendiente: !cierreHoy,
      // alertas,
    });
  } catch (error) {
    console.error("Error obteniendo alertas:", error);
    return NextResponse.json(
      { error: "Error al obtener alertas" },
      { status: 500 },
    );
  }
}
