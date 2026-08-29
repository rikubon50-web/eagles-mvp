"use client";
// 記事詳細の閲覧数トラッカー。sessionStorage で同一セッションの重複計上を防ぎ、
// 初回表示のみ RPC increment_post_view を呼ぶ（keepalive・失敗は無視）。
// 閲覧数は公開ページには表示しない（管理画面 /admin/blog のみ）。
import { useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    if (!SUPABASE_URL || !ANON_KEY) return;
    const key = `viewed:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage が使えなくても計上自体は試みる */
    }
    fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_post_view`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_id: postId }),
      keepalive: true,
    }).catch(() => {});
  }, [postId]);

  return null;
}
