import { SupabaseClient } from "@supabase/supabase-js";
import {
  Cajas,
  CajasRoturas,
  Devolucion,
  Entrega,
  Expedicion,
  Recogida,
  TABLAS,
  Tapas,
  Traspaso,
} from "./constants";
import {
  AjusteStr,
  applyAjuste,
  hasCajas,
  prettyName,
  sameCajas,
  sumCajas,
  sumTapas,
} from "./utils";

export async function getComparacionEntrega(
  db: SupabaseClient,
  fecha: string,
): Promise<ItemComparacionEntrega[]> {
  // Obtener expediciones y entregas

  const [expedicionesRaw, traspasosRaw, entregasRaw] = await Promise.all([
    db.from(TABLAS.EXPEDICION).select<string, Expedicion>().eq("fecha", fecha),
    db.from(TABLAS.TRASPASO).select<string, Traspaso>().eq("fecha", fecha),
    db.from(TABLAS.ENTREGA).select<string, Entrega>().eq("fecha", fecha),
  ]);

  const error =
    expedicionesRaw.error || traspasosRaw.error || entregasRaw.error;

  if (error !== null) throw new Error(error.message);

  const expediciones = expedicionesRaw.data
    ? (expedicionesRaw.data
        .map(applyAjuste)
        .filter(hasCajas) as AjusteStr<Expedicion>[])
    : [];

  const traspasos = traspasosRaw.data
    ? (traspasosRaw.data
        .map(applyAjuste)
        .filter(hasCajas) as AjusteStr<Traspaso>[])
    : [];

  const entregas = entregasRaw.data
    ? (entregasRaw.data
        .map(applyAjuste)
        .filter(hasCajas) as AjusteStr<Entrega>[])
    : [];

  // Agrupar por centro de distribución
  const centrosExp = new Map<string, ItemComparacionEntrega>();

  for (const current of expediciones) {
    current.nombre = prettyName(current.nombre);
    if (current.ajuste) {
      current.ajuste = prettyName(current.ajuste) as string;
    }
    const centro = current.provincia ?? current.centro_distribucion;
    if (centrosExp.has(centro)) {
      const item = centrosExp.get(centro) as ItemComparacionEntrega;
      item.almacen = appendNombre(item.almacen, current.almacen);
      item.expedicion = {
        nombre: appendNombre(item.expedicion?.nombre, current.nombre),
        cajas: item.expedicion?.cajas
          ? sumCajas(item.expedicion?.cajas, current.cajas)
          : current.cajas,
        ajuste: appendNombre(item.expedicion?.ajuste, current.ajuste),
      };
    } else {
      centrosExp.set(centro, {
        centro_distribucion: centro,
        almacen: current.almacen,
        chapa: undefined,
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
    current.nombre = prettyName(current.nombre);
    if (current.ajuste) {
      current.ajuste = prettyName(current.ajuste) as string;
    }
    const centro = current.provincia ?? current.centro_distribucion;
    if (centrosExp.has(centro)) {
      const item = centrosExp.get(centro) as ItemComparacionEntrega;
      item.almacen = appendNombre(item.almacen, current.almacen);
      item.chapa = appendNombre(item.chapa, current.chapa);
      item.traspaso = {
        nombre: appendNombre(item.traspaso?.nombre, current.nombre),
        cajas: item.traspaso?.cajas
          ? sumCajas(item.traspaso?.cajas, current.cajas)
          : current.cajas,
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
    current.nombre = prettyName(current.nombre);
    if (current.ajuste) {
      current.ajuste = prettyName(current.ajuste) as string;
    }
    const centro = current.provincia ?? current.centro_distribucion;
    if (centrosExp.has(centro)) {
      const item = centrosExp.get(centro) as ItemComparacionEntrega;
      item.chapa = appendNombre(item.chapa, current.chapa);
      item.entrega = {
        nombre: appendNombre(item.entrega?.nombre, current.nombre),
        cajas: item.entrega?.cajas
          ? sumCajas(item.entrega?.cajas, current.cajas)
          : current.cajas,
        ajuste: appendNombre(item.entrega?.ajuste, current.ajuste),
      };
    } else {
      centrosExp.set(centro, {
        centro_distribucion: centro,
        almacen: undefined,
        chapa: current.chapa,
        expedicion: null,
        traspaso: null,
        entrega: {
          nombre: current.nombre,
          cajas: current.cajas,
          ajuste: current.ajuste,
        },
        alerta: true,
      });
    }
  }

  return Array.from(centrosExp.values());
}

export async function getComparacionRecogida(
  db: SupabaseClient,
  fecha: string,
): Promise<ItemComparacionRecogida[]> {
  // Obtener devoluciones y recogidas

  const [recogidasRaw, devolucionesRaw] = await Promise.all([
    db.from(TABLAS.RECOGIDA).select<string, Recogida>().eq("fecha", fecha),
    db.from(TABLAS.DEVOLUCION).select<string, Devolucion>().eq("fecha", fecha),
  ]);

  const error = recogidasRaw.error || devolucionesRaw.error;

  if (error !== null) throw new Error(error.message);

  const recogidas = recogidasRaw.data
    ? (recogidasRaw.data
        .map(applyAjuste)
        .filter(hasCajas) as AjusteStr<Recogida>[])
    : [];

  const devoluciones = devolucionesRaw.data
    ? (devolucionesRaw.data
        .map(applyAjuste)
        .filter(hasCajas) as AjusteStr<Devolucion>[])
    : [];

  // Agrupar por centro de distribución
  const centrosRec = new Map<string, ItemComparacionRecogida>();

  for (const current of recogidas) {
    const centro = current.centro_distribucion;
    current.nombre = prettyName(current.nombre);
    if (current.ajuste) {
      current.ajuste = prettyName(current.ajuste) as string;
    }
    if (centrosRec.has(centro)) {
      const item = centrosRec.get(centro) as ItemComparacionRecogida;
      item.chapa = appendNombre(item.chapa, current.chapa);
      item.recogida = {
        nombre: appendNombre(item.recogida?.nombre, current.nombre),
        cajas: item.recogida?.cajas
          ? sumCajas(item.recogida?.cajas, current.cajas)
          : current.cajas,
        roturas: {
          cajas: item.recogida?.roturas.cajas
            ? sumCajas(item.recogida.roturas.cajas, current.roturas.cajas)
            : current.roturas.cajas,
          tapas: item.recogida?.roturas.tapas
            ? sumTapas(item.recogida.roturas.tapas, current.roturas.tapas)
            : current.roturas.tapas,
        },
      };
    } else {
      centrosRec.set(centro, {
        centro_distribucion: centro,
        almacen: undefined,
        chapa: current.chapa,
        recogida: {
          nombre: current.nombre,
          cajas: current.cajas,
          roturas: current.roturas,
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
    current.nombre = prettyName(current.nombre);
    if (current.ajuste) {
      current.ajuste = prettyName(current.ajuste) as string;
    }
    if (centrosRec.has(centro)) {
      const item = centrosRec.get(centro) as ItemComparacionRecogida;
      item.almacen = appendNombre(item.almacen, current.almacen);
      item.devolucion = {
        nombre: appendNombre(item.devolucion?.nombre, current.nombre),
        cajas: item.devolucion?.cajas
          ? sumCajas(item.devolucion?.cajas, current.cajas)
          : current.cajas,
        roturas: {
          cajas: item.devolucion?.roturas.cajas
            ? sumCajas(item.devolucion.roturas.cajas, current.roturas.cajas)
            : current.roturas.cajas,
          tapas: item.devolucion?.roturas.tapas
            ? sumTapas(item.devolucion.roturas.tapas, current.roturas.tapas)
            : current.roturas.tapas,
        },
        ajuste: appendNombre(item.devolucion?.ajuste, current.ajuste),
      };
    } else {
      centrosRec.set(centro, {
        centro_distribucion: centro,
        almacen: current.almacen,
        chapa: undefined,
        recogida: null,
        devolucion: {
          nombre: current.nombre,
          cajas: current.cajas,
          roturas: current.roturas,
          ajuste: current.ajuste,
        },
        alerta: false,
        rotura: false,
      });
    }
  }

  return Array.from(centrosRec.values());
}

export function alertCompare(
  event1: { cajas: Cajas; roturas?: { cajas: Cajas; tapas: Tapas } },
  event2: { cajas: Cajas; roturas?: { cajas: Cajas; tapas: Tapas } },
): boolean {
  if (!sameCajas(event2.cajas, event1.cajas)) return true;
  if (event1.roturas && event2.roturas) {
    if (!sameCajas(event2.roturas.cajas, event1.roturas.cajas)) return true;
    if (!sameCajas(event2.roturas.tapas, event1.roturas.tapas)) return true;
  }
  return false;
}

export function appendNombre(
  actual?: string,
  nuevo?: string,
): string | undefined {
  if (!actual) return nuevo;
  if (!nuevo) return actual;
  if (actual.includes(nuevo)) return actual;
  return actual + " + " + nuevo;
}

export interface ItemComparacion {
  nombre?: string;
  cajas: Cajas;
  ajuste?: string;
}

export interface ItemComparacionEntrega {
  chapa?: string;
  centro_distribucion: string;
  almacen?: string;
  expedicion: ItemComparacion | null;
  traspaso: ItemComparacion | null;
  entrega: ItemComparacion | null;
  alerta: boolean;
}

export interface ItemComparacionRecogida {
  centro_distribucion: string;
  almacen?: string;
  chapa?: string;
  recogida: (ItemComparacion & CajasRoturas) | null;
  devolucion: (ItemComparacion & CajasRoturas) | null;
  alerta: boolean;
  rotura: boolean;
}
