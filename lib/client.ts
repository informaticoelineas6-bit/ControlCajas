import { createClient } from "@supabase/supabase-js";

type FrontendClient = ReturnType<typeof createClient>;
type RealtimeChannelLike = ReturnType<FrontendClient["channel"]>;

function createNoopChannel(): RealtimeChannelLike {
  return {
    on: () => createNoopChannel(),
    subscribe: () => createNoopChannel(),
    unsubscribe: async () => "ok",
  } as unknown as RealtimeChannelLike;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const frontendClient: FrontendClient =
  supabaseUrl && supabasePublicKey
    ? createClient(supabaseUrl, supabasePublicKey)
    : ({
        channel: () => createNoopChannel(),
      } as unknown as FrontendClient);
