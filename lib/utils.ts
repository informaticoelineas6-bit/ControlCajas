import { Cajas, Evento, EventoRotura, Tapas, Usuario } from "@/lib/constants";
import { NextRequest } from "next/server";

export type AjusteStr<Str> = Omit<Str, "ajuste"> & { ajuste?: string };

export function applyAjuste(
  item: Evento | EventoRotura,
): AjusteStr<Evento> | AjusteStr<EventoRotura> {
  if (!item.ajuste) {
    return { ...item, ajuste: undefined };
  }
  item.cajas = {
    blancas: (item.cajas.blancas ?? 0) + (item.ajuste.cajas.blancas ?? 0),
    negras: (item.cajas.negras ?? 0) + (item.ajuste.cajas.negras ?? 0),
    verdes: (item.cajas.verdes ?? 0) + (item.ajuste.cajas.verdes ?? 0),
  };
  if (
    "cajas_rotas" in item &&
    item.cajas_rotas &&
    "cajas_rotas" in item.ajuste &&
    item.ajuste.cajas_rotas
  ) {
    item.cajas_rotas = {
      blancas:
        (item.cajas_rotas.blancas ?? 0) +
        (item.ajuste.cajas_rotas.blancas ?? 0),
      negras:
        (item.cajas_rotas.negras ?? 0) + (item.ajuste.cajas_rotas.negras ?? 0),
      verdes:
        (item.cajas_rotas.verdes ?? 0) + (item.ajuste.cajas_rotas.verdes ?? 0),
    };
  }
  if (
    "tapas_rotas" in item &&
    item.tapas_rotas &&
    "tapas_rotas" in item.ajuste &&
    item.ajuste.tapas_rotas
  ) {
    item.tapas_rotas = {
      blancas:
        (item.tapas_rotas.blancas ?? 0) +
        (item.ajuste.tapas_rotas.blancas ?? 0),
      negras:
        (item.tapas_rotas.negras ?? 0) + (item.ajuste.tapas_rotas.negras ?? 0),
    };
  }
  return {
    ...item,
    ajuste: item.ajuste?.nombre,
  };
}

export function sumCajas(
  actuales: Cajas | Tapas,
  nuevas: Cajas | Tapas,
): Cajas | Tapas {
  if (
    "verdes" in actuales &&
    actuales?.verdes &&
    "verdes" in nuevas &&
    nuevas?.verdes
  ) {
    return {
      blancas: (actuales.blancas ?? 0) + (nuevas.blancas ?? 0),
      negras: (actuales.negras ?? 0) + (nuevas.negras ?? 0),
      verdes: (actuales.verdes ?? 0) + (nuevas.verdes ?? 0),
    } as Cajas;
  } else {
    return {
      blancas: (actuales.blancas ?? 0) + (nuevas.blancas ?? 0),
      negras: (actuales.negras ?? 0) + (nuevas.negras ?? 0),
    } as Tapas;
  }
}

export function sameCajas(a: Cajas | Tapas, b: Cajas | Tapas): boolean {
  return (
    a.blancas === b.blancas &&
    a.negras === b.negras &&
    ("verdes" in a && "verdes" in b ? a.verdes === b.verdes : true)
  );
}

export function totalCajas(item: Partial<Cajas | Tapas>): number {
  return (
    (item?.blancas ?? 0) +
    (item?.negras ?? 0) +
    ("verdes" in item ? (item?.verdes ?? 0) : 0)
  );
}

export function hasCajas(item: { cajas: Cajas }): boolean {
  if (item.cajas) {
    return totalCajas(item.cajas) > 0;
  } else {
    return false;
  }
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

export function usuarioCookie(request: NextRequest): Usuario | null {
  const usuarioCookie = request.cookies.get("usuario");
  let usuario: Usuario | null = null;
  if (usuarioCookie) {
    try {
      usuario = JSON.parse(usuarioCookie.value);
      if (!usuario) {
        return null;
      }
    } catch {
      return null;
    }
  }
  return usuario ?? null;
}
