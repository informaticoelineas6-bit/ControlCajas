import {
  Cajas,
  CAJAS_ARRAY,
  COLORES_CAJAS,
  COLORES_TAPAS,
  Evento,
  EventoRotura,
  Tapas,
  TAPAS_ARRAY,
} from "@/lib/constants";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

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

export function sumCajas(actuales: Cajas, nuevas: Cajas): Cajas {
  return {
    blancas: (actuales.blancas ?? 0) + (nuevas.blancas ?? 0),
    negras: (actuales.negras ?? 0) + (nuevas.negras ?? 0),
    verdes: (actuales.verdes ?? 0) + (nuevas.verdes ?? 0),
  };
}

export function sumTapas(actuales: Tapas, nuevas: Tapas): Tapas {
  return {
    blancas: (actuales.blancas ?? 0) + (nuevas.blancas ?? 0),
    negras: (actuales.negras ?? 0) + (nuevas.negras ?? 0),
  };
}

export function sameCajas(a: Cajas, b: Cajas): boolean;
export function sameCajas(a: Tapas, b: Tapas): boolean;
export function sameCajas(a: Cajas | Tapas, b: Cajas | Tapas): boolean {
  return (
    a.blancas === b.blancas &&
    a.negras === b.negras &&
    ("verdes" in a && "verdes" in b ? a.verdes === b.verdes : true)
  );
}

export function totalCajas(item: Cajas | Tapas): number {
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

export function formatDate(date: string): string {
  const dateObj = parseISO(date);
  return format(dateObj, "PPP", { locale: es });
}

export function formatCajas(item: Cajas, separator: string = "\n"): string {
  return CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
    const capitalize = color.charAt(0).toUpperCase() + color.slice(1);
    return `${capitalize}: ${item[color] ?? "-"}`;
  }).join(separator);
}

export function formatTapas(item: Tapas, separator: string = "\n"): string {
  return TAPAS_ARRAY.map((color: COLORES_TAPAS) => {
    const capitalize = color.charAt(0).toUpperCase() + color.slice(1);
    return `${capitalize}: ${item[color] ?? "-"}`;
  }).join(separator);
}

export type DeudaAct<Centro> = Centro & {
  deuda_activa: Cajas;
  fecha_liquidacion: string | null;
};

// export function deudaActiva(
//   centro: CentroDistribucion,
//   entregas: AjusteStr<Entrega>[],
// ): DeudaAct<CentroDistribucion> {
//   const rotDate = new Date();
//   rotDate.setUTCDate(rotDate.getUTCDate() - (centro.rotacion ?? 0));
//   const targetStr = rotDate.toISOString().split("T")[0]; // e.g., "2026-03-25"

//   const listaEntregas = entregas
//     .filter((elem) => elem.centro_distribucion === centro.nombre)
//     .sort((a, b) => b.fecha.localeCompare(a.fecha));

//   const deuda: Cajas = {
//     blancas: centro.deuda.blancas,
//     negras: centro.deuda.negras,
//     verdes: centro.deuda.verdes,
//   };
//   let deuda_activa: Cajas = {
//     blancas: 0,
//     negras: 0,
//     verdes: 0,
//   };
//   for (const entrega of listaEntregas) {
//     if (entrega.fecha < targetStr) {
//       deuda_activa = deuda;
//     } else if (deuda.blancas >= 0 || deuda.negras >= 0 || deuda.verdes >= 0) {
//       deuda.blancas -= entrega.cajas.blancas;
//       deuda.negras -= entrega.cajas.negras;
//       deuda.verdes -= entrega.cajas.verdes;
//     } else {
//       break;
//     }
//   }

//   return { ...centro, deuda_activa };
// }

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Error en el servidor";

  const errorPatterns = [
    // Errores de conexión (Timeout, Network, etc.)
    {
      pattern: /fetch|network|timeout|timed out/i,
      message: "Error conectando a la base de datos",
    },
    // Permisos / Row Level Security
    {
      pattern: /permission denied|row-level security/i,
      message: "Acceso no autorizado a la base de datos",
    },
    // Rate limiting
    {
      pattern: /too many requests|rate limit/i,
      message: "Demasiadas solicitudes",
    },
    // Autenticación de API / JWT
    {
      pattern: /invalid api key|no api key|jwt|signature verification/i,
      message: "Error de autenticación a la base de datos",
    },
  ];

  for (const { pattern, message } of errorPatterns) {
    if (pattern.test(error.message)) {
      return message;
    }
  }

  return "Error en el servidor";
}

export function formatName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-záéíóú]+/gi, ".")
    .replace(/^\.|\.$/g, "");
}

export function prettyName(name: string): string {
  return name
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
