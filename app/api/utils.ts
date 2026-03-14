import { Cajas, ROLES } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

export function applyAjuste(item: any): any {
  if (item.ajuste) {
    return {
      ...item,
      cajas: {
        blancas: (item.cajas?.blancas ?? 0) + (item.ajuste.cajas?.blancas ?? 0),
        negras: (item.cajas?.negras ?? 0) + (item.ajuste.cajas?.negras ?? 0),
        verdes: (item.cajas?.verdes ?? 0) + (item.ajuste.cajas?.verdes ?? 0),
      },
      cajas_rotas: {
        blancas:
          (item.cajas_rotas?.blancas ?? 0) +
          (item.ajuste.cajas_rotas?.blancas ?? 0),
        negras:
          (item.cajas_rotas?.negras ?? 0) +
          (item.ajuste.cajas_rotas?.negras ?? 0),
        verdes:
          (item.cajas_rotas?.verdes ?? 0) +
          (item.ajuste.cajas_rotas?.verdes ?? 0),
      },
      tapas_rotas: {
        blancas:
          (item.tapas_rotas?.blancas ?? 0) +
          (item.ajuste.tapas_rotas?.blancas ?? 0),
        negras:
          (item.tapas_rotas?.negras ?? 0) +
          (item.ajuste.tapas_rotas?.negras ?? 0),
        verdes:
          (item.tapas_rotas?.verdes ?? 0) +
          (item.ajuste.tapas_rotas?.verdes ?? 0),
      },
      ajuste: item.ajuste.nombre,
    };
  }
  return item;
}

export function sumCajas(actuales: Cajas, nuevas: Cajas): Cajas {
  return {
    blancas: (actuales?.blancas ?? 0) + (nuevas?.blancas ?? 0),
    negras: (actuales?.negras ?? 0) + (nuevas?.negras ?? 0),
    verdes: (actuales?.verdes ?? 0) + (nuevas?.verdes ?? 0),
  };
}

export function sameCajas(a: Cajas, b: Cajas): boolean {
  return (
    a.blancas === b.blancas && a.negras === b.negras && a.verdes === b.verdes
  );
}

export function totalCajas(item: Cajas): number {
  return (item?.blancas ?? 0) + (item?.negras ?? 0) + (item?.verdes ?? 0);
}

export function appendNombre(
  actual?: string,
  nuevo?: string,
): string | undefined {
  if (!actual && !nuevo) return undefined;
  if (!actual) return nuevo;
  if (!nuevo) return actual;
  if (actual.includes(nuevo)) return actual;
  return actual + " + " + nuevo;
}

export function userRole(
  request: NextRequest,
): (typeof ROLES)[keyof typeof ROLES] | null {
  const usuarioCookie = request.cookies.get("usuario");
  let usuario: any = null;
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

  return usuario ? usuario.rol : null;
}
