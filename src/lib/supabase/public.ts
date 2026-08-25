import { createClient } from "@supabase/supabase-js";

// 認証不要の公開読取用（cookie に依存しないので ISR/ビルドでも安全）
export function createSupabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
