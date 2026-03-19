import {
  Cajas,
  COLECCIONES,
  Devolucion,
  Entrega,
  Expedicion,
  ItemComparacionEntrega,
  ItemComparacionRecogida,
  Recogida,
  Tapas,
  Traspaso,
} from "./constants";
import {
  appendNombre,
  applyAjuste,
  hasCajas,
  sameCajas,
  sumCajas,
} from "./utils";

export async function getComparacionEntrega(
  db: any,
  fecha: string,
): Promise<ItemComparacionEntrega[]> {
  // Obtener expediciones y entregas
  const expediciones = (
    await db.collection(COLECCIONES.EXPEDICION).find({ fecha }).toArray()
  )
    .map(applyAjuste)
    .filter(hasCajas) as Expedicion[];

  const entregas = (
    await db.collection(COLECCIONES.ENTREGA).find({ fecha }).toArray()
  )
    .map(applyAjuste)
    .filter(hasCajas) as Entrega[];

  const traspasos = (
    await db.collection(COLECCIONES.TRASPASO).find({ fecha }).toArray()
  )
    .map(applyAjuste)
    .filter(hasCajas) as Traspaso[];

  // Agrupar por centro de distribución
  const centrosExp = new Map<string, ItemComparacionEntrega>();

  for (const current of expediciones) {
    const centro = current.centro_distribucion;
    if (centrosExp.has(centro)) {
      const item = centrosExp.get(centro) as ItemComparacionEntrega;
      item.almacen = appendNombre(item.almacen, current.almacen);
      item.expedicion = {
        nombre: appendNombre(item.expedicion?.nombre, current.nombre),
        cajas: item.expedicion?.cajas
          ? (sumCajas(item.expedicion?.cajas, current.cajas) as Cajas)
          : current.cajas,
        ajuste: appendNombre(
          item.expedicion?.ajuste,
          current.ajuste as unknown as string | undefined,
        ),
      };
    } else {
      centrosExp.set(centro, {
        centro_distribucion: centro,
        almacen: current.almacen,
        chapa: undefined,
        expedicion: {
          nombre: current.nombre,
          cajas: current.cajas,
          ajuste: current.ajuste as unknown as string | undefined,
        },
        traspaso: undefined,
        entrega: undefined,
        alerta: false,
      });
    }
  }

  for (const current of traspasos) {
    const centro = current.centro_distribucion;
    if (centrosExp.has(centro)) {
      const item = centrosExp.get(centro) as ItemComparacionEntrega;
      item.almacen = appendNombre(item.almacen, current.almacen);
      item.chapa = appendNombre(item.chapa, current.chapa);
      item.traspaso = {
        nombre: appendNombre(item.traspaso?.nombre, current.nombre),
        cajas: item.traspaso?.cajas
          ? (sumCajas(item.traspaso?.cajas, current.cajas) as Cajas)
          : current.cajas,
        ajuste: appendNombre(
          item.traspaso?.ajuste,
          current.ajuste as unknown as string | undefined,
        ),
      };
    } else {
      centrosExp.set(centro, {
        centro_distribucion: centro,
        almacen: current.almacen,
        chapa: current.chapa,
        expedicion: undefined,
        traspaso: {
          nombre: current.nombre,
          cajas: current.cajas,
          ajuste: current.ajuste as unknown as string | undefined,
        },
        entrega: undefined,
        alerta: false,
      });
    }
  }

  for (const current of entregas) {
    const centro = current.centro_distribucion;
    if (centrosExp.has(centro)) {
      const item = centrosExp.get(centro) as ItemComparacionEntrega;
      item.chapa = appendNombre(item.chapa, current.chapa);
      item.entrega = {
        nombre: appendNombre(item.entrega?.nombre, current.nombre),
        cajas: item.entrega?.cajas
          ? (sumCajas(item.entrega?.cajas, current.cajas) as Cajas)
          : current.cajas,
        ajuste: appendNombre(
          item.entrega?.ajuste,
          current.ajuste as unknown as string | undefined,
        ),
      };
    } else {
      centrosExp.set(centro, {
        centro_distribucion: centro,
        almacen: undefined,
        chapa: current.chapa,
        expedicion: undefined,
        traspaso: undefined,
        entrega: {
          nombre: current.nombre,
          cajas: current.cajas,
          ajuste: current.ajuste as unknown as string | undefined,
        },
        alerta: true,
      });
    }
  }

  return Array.from(centrosExp.values());
}

export async function getComparacionRecogida(
  db: any,
  fecha: string,
): Promise<ItemComparacionRecogida[]> {
  // Obtener devoluciones y recogidas
  const recogidas = (
    await db.collection(COLECCIONES.RECOGIDA).find({ fecha }).toArray()
  )
    .map(applyAjuste)
    .filter(hasCajas) as Recogida[];

  const devoluciones = (
    await db.collection(COLECCIONES.DEVOLUCION).find({ fecha }).toArray()
  )
    .map(applyAjuste)
    .filter(hasCajas) as Devolucion[];

  // Agrupar por centro de distribución
  const centrosRec = new Map<string, ItemComparacionRecogida>();

  for (const current of recogidas) {
    const centro = current.centro_distribucion;
    if (centrosRec.has(centro)) {
      const item = centrosRec.get(centro) as ItemComparacionRecogida;
      item.chapa = appendNombre(item.chapa, current.chapa);
      item.recogida = {
        nombre: appendNombre(item.recogida?.nombre, current.nombre),
        cajas: item.recogida?.cajas
          ? (sumCajas(item.recogida?.cajas, current.cajas) as Cajas)
          : current.cajas,
        cajas_rotas: item.recogida?.cajas_rotas
          ? (sumCajas(item.recogida?.cajas_rotas, current.cajas_rotas) as Cajas)
          : current.cajas_rotas,
        tapas_rotas: item.recogida?.tapas_rotas
          ? sumCajas(item.recogida?.tapas_rotas, current.tapas_rotas)
          : current.tapas_rotas,
        ajuste: appendNombre(
          item.recogida?.ajuste,
          current.ajuste as unknown as string | undefined,
        ),
      };
    } else {
      centrosRec.set(centro, {
        centro_distribucion: centro,
        almacen: undefined,
        chapa: current.chapa,
        recogida: {
          nombre: current.nombre,
          cajas: current.cajas,
          cajas_rotas: current.cajas_rotas,
          tapas_rotas: current.tapas_rotas,
          ajuste: current.ajuste as unknown as string | undefined,
        },
        devolucion: undefined,
        alerta: false,
        rotura: false,
      });
    }
  }

  for (const current of devoluciones) {
    const centro = current.centro_distribucion;
    if (centrosRec.has(centro)) {
      const item = centrosRec.get(centro) as ItemComparacionRecogida;
      item.almacen = appendNombre(item.almacen, current.almacen);
      item.devolucion = {
        nombre: appendNombre(item.devolucion?.nombre, current.nombre),
        cajas: item.devolucion?.cajas
          ? (sumCajas(item.devolucion?.cajas, current.cajas) as Cajas)
          : current.cajas,
        cajas_rotas: item.devolucion?.cajas_rotas
          ? (sumCajas(
              item.devolucion?.cajas_rotas,
              current.cajas_rotas,
            ) as Cajas)
          : current.cajas_rotas,
        tapas_rotas: item.devolucion?.tapas_rotas
          ? sumCajas(item.devolucion?.tapas_rotas, current.tapas_rotas)
          : current.tapas_rotas,
        ajuste: appendNombre(
          item.devolucion?.ajuste,
          current.ajuste as unknown as string | undefined,
        ),
      };
    } else {
      centrosRec.set(centro, {
        centro_distribucion: centro,
        almacen: current.almacen,
        chapa: undefined,
        recogida: undefined,
        devolucion: {
          nombre: current.nombre,
          cajas: current.cajas,
          cajas_rotas: current.cajas_rotas,
          tapas_rotas: current.tapas_rotas,
          ajuste: current.ajuste as unknown as string | undefined,
        },
        alerta: false,
        rotura: false,
      });
    }
  }

  return Array.from(centrosRec.values());
}

export function alertCompare(
  event1: { cajas: Cajas; cajas_rotas?: Cajas; tapas_rotas?: Tapas },
  event2: { cajas: Cajas; cajas_rotas?: Cajas; tapas_rotas?: Tapas },
): boolean {
  if (!sameCajas(event2.cajas, event1.cajas)) return true;
  if (event1.cajas_rotas && event2.cajas_rotas) {
    if (!sameCajas(event2.cajas_rotas, event1.cajas_rotas)) return true;
  }
  if (event1.tapas_rotas && event2.tapas_rotas) {
    if (!sameCajas(event2.tapas_rotas, event1.tapas_rotas)) return true;
  }
  return false;
}
