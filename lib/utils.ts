import {
  Almacen,
  Cajas,
  CentroDistribucion,
  Entrega,
  Evento,
  EventoRotura,
  Provincia,
  Tapas,
  Usuario,
  Vehiculo,
} from "@/lib/constants";

export type AjusteStr<Str> = Omit<Str, "ajuste"> & { ajuste?: string };

export function applyAjuste(
  item: Evento | EventoRotura,
): AjusteStr<Evento | EventoRotura> {
  if (!item.ajuste) {
    return { ...item, ajuste: undefined };
  }
  item.cajas = {
    blancas: (item.cajas.blancas ?? 0) + (item.ajuste.cajas.blancas ?? 0),
    negras: (item.cajas.negras ?? 0) + (item.ajuste.cajas.negras ?? 0),
    verdes: (item.cajas.verdes ?? 0) + (item.ajuste.cajas.verdes ?? 0),
  };
  if ("roturas" in item) {
    item.roturas = {
      cajas: {
        blancas:
          (item.roturas.cajas.blancas ?? 0) +
          (item.ajuste.roturas.cajas.blancas ?? 0),
        negras:
          (item.roturas.cajas.negras ?? 0) +
          (item.ajuste.roturas.cajas.negras ?? 0),
        verdes:
          (item.roturas.cajas.verdes ?? 0) +
          (item.ajuste.roturas.cajas.verdes ?? 0),
      },
      tapas: {
        blancas:
          (item.roturas.tapas.blancas ?? 0) +
          (item.ajuste.roturas.tapas.blancas ?? 0),
        negras:
          (item.roturas.tapas.negras ?? 0) +
          (item.ajuste.roturas.tapas.negras ?? 0),
      },
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

export function isEnabled(
  item: Almacen | CentroDistribucion | Vehiculo | Usuario | Provincia,
): boolean {
  return item.ajuste?.habilitado ?? true;
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

export function formatDate(date: string): string {
  return new Date(date).toLocaleString("es-MX", {
    dateStyle: "long",
  });
}

export type DeudaAct<Centro> = Centro & { deuda_activa: Cajas };
interface DeudaActivaOptions {
  entregasFiltradas?: boolean;
  entregasOrdenadas?: boolean;
}

export function deudaActiva(
  centro: CentroDistribucion,
  entregas: AjusteStr<Entrega>[],
  options: DeudaActivaOptions = {},
): DeudaAct<CentroDistribucion> {
  const rotDate = new Date();
  rotDate.setUTCDate(rotDate.getUTCDate() - (centro.rotacion ?? 0));
  const targetStr = rotDate.toISOString().split("T")[0]; // e.g., "2026-03-25"

  //TODO: Revisar y rehacer de forma más eficiente.

  const entregasCentro = options.entregasFiltradas
    ? entregas
    : entregas.filter((elem) => elem.centro_distribucion === centro.nombre);
  const listaEntregas = options.entregasOrdenadas
    ? entregasCentro
    : [...entregasCentro].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const deuda: Cajas = {
    blancas: centro.deuda.blancas,
    negras: centro.deuda.negras,
    verdes: centro.deuda.verdes,
  };
  let deuda_activa: Cajas = {
    blancas: 0,
    negras: 0,
    verdes: 0,
  };
  for (const entrega of listaEntregas) {
    if (entrega.fecha < targetStr) {
      deuda_activa = deuda;
    } else if (deuda.blancas >= 0 || deuda.negras >= 0 || deuda.verdes >= 0) {
      deuda.blancas -= entrega.cajas.blancas;
      deuda.negras -= entrega.cajas.negras;
      deuda.verdes -= entrega.cajas.verdes;
    } else {
      break;
    }
  }

  return { ...centro, deuda_activa };
}
