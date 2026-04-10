import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AuditLog, Nuevo, TABLAS } from "./constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

export const connectToDatabase = async () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase server environment variables are not configured");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
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
  newObj.ajuste = undefined;
  newObj.created_at = undefined;

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
