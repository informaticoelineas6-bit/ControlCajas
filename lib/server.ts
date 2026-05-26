import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AuditLog, Nuevo, TABLAS } from "./constants";

function parseTimeoutMs(value?: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10000;
}

function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const upstreamSignal = init?.signal;
    let timedOut = false;

    const abortFromUpstream = () => controller.abort();

    if (upstreamSignal?.aborted) {
      controller.abort();
    } else if (upstreamSignal) {
      upstreamSignal.addEventListener("abort", abortFromUpstream, {
        once: true,
      });
    }

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) {
        throw new Error(
          `Supabase request timed out after ${timeoutMs}ms: ${String(input)}`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    }
  };
}

export const connectToDatabase = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase server environment variables are not configured");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: createTimeoutFetch(
        parseTimeoutMs(process.env.SUPABASE_REQUEST_TIMEOUT_MS),
      ),
    },
  });
};

export async function LogAudit(
  db: SupabaseClient,
  action: "UPDATE" | "INSERT" | "DELETE",
  prevObject: object,
  object_type: string,
  usuario: string,
  update?: object,
) {
  const log: Nuevo<AuditLog> = {
    action,
    object_type,
    snapshot: prevObject,
    usuario,
    changes: update
      ? extractDifferences(
          prevObject as Record<string, unknown>,
          update as Record<string, unknown>,
        )
      : undefined,
  };
  const { error } = await db.from(TABLAS.AUDITLOG).insert(log);

  if (error) throw new Error(error.message);
}

function extractDifferences(
  prevObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
) {
  prevObj.ajuste = undefined;
  prevObj.created_at = undefined;
  prevObj.habilitado = undefined;
  newObj.ajuste = undefined;
  newObj.created_at = undefined;
  newObj.habilitado = undefined;

  const oldDiff: Record<string, unknown> = {};
  const newDiff: Record<string, unknown> = {};

  const keys = new Set([...Object.keys(prevObj), ...Object.keys(newObj)]);

  for (const key of keys) {
    if (prevObj[key] && prevObj[key] !== newObj[key] && newObj[key]) {
      oldDiff[key] = prevObj[key];
      newDiff[key] = newObj[key];
    }
  }

  return { prev: oldDiff, new: newDiff };
}

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
