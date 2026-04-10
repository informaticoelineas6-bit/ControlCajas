import { createServerClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { AuditLog, Nuevo, TABLAS } from "./constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY;

export const connectToDatabase = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
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
