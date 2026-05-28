import {
  Cajas,
  CAJAS_ARRAY,
  COLORES_CAJAS,
  COLORES_TAPAS,
  Tapas,
  TAPAS_ARRAY,
} from "@/lib/constants";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

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
    (item.blancas ?? 0) +
    (item.negras ?? 0) +
    ("verdes" in item ? (item.verdes ?? 0) : 0)
  );
}

export function hasCajas(item: { cajas: Cajas }): boolean {
  if (item.cajas) {
    return totalCajas(item.cajas) > 0;
  } else {
    return false;
  }
}

export function formatDate(date: string): string {
  try {
    const dateObj = parseISO(date);
    return format(dateObj, "PPP", { locale: es });
  } catch (err) {
    console.log("Error al formatear la fecha:" + date, err);
    return "-";
  }
}

export function formatNumber(
  number: number | undefined,
  placeholder: string = "-",
): string {
  if (number === undefined) {
    return placeholder;
  } else {
    return number.toLocaleString("es-MX");
  }
}

export function formatCajas(
  item: Cajas,
  options?: { fullName: boolean; separator: string },
): string {
  options = {
    fullName: options?.fullName ?? true,
    separator: options?.separator ?? "\n",
  };

  return CAJAS_ARRAY.map((color: COLORES_CAJAS) => {
    const capitalize =
      color.charAt(0).toUpperCase() + (options.fullName ? color.slice(1) : "");
    return `${capitalize}: ${formatNumber(item[color], "-")}`;
  }).join(options.separator);
}

export function formatTapas(
  item: Tapas,
  options?: { fullName: boolean; separator: string },
): string {
  options = {
    fullName: options?.fullName ?? true,
    separator: options?.separator ?? "\n",
  };

  return TAPAS_ARRAY.map((color: COLORES_TAPAS) => {
    const capitalize =
      color.charAt(0).toUpperCase() + (options.fullName ? color.slice(1) : "");
    return `${capitalize}: ${formatNumber(item[color], "-")}`;
  }).join(options.separator);
}

export function formatName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9áéíóú]+/gi, ".")
    .replace(/^\.|\.$/g, "");
}

export function prettyName(name: string): string {
  try {
    return name
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch (err) {
    console.error("Error al formatear el nombre:" + name, err);
    return "-";
  }
}
