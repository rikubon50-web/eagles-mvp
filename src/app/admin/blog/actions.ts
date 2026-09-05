"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { postInputSchema } from "@/lib/posts-domain";
import { sanitizePostBody } from "@/lib/sanitize-body";

type SaveInput = {
  id: string; // 新規もエディタ側で newPostId() 採番済み
  title: string;
  body: string;
  tags: string[];
  thumbnailUrl: string | null;
  publish: boolean;
};

export async function savePost(input: SaveInput):
  Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const profile = await getProfile();
  if (!profile) return { ok: false, error: "ログインしてください" };

  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }
  if (!/^[a-z0-9_-]{1,64}$/i.test(input.id)) {
    return { ok: false, error: "不正な記事IDです" };
  }
  // 公開権を持つ全部員アカウントからの任意HTML持ち込みを防ぐ許可リスト浄化。
  const sanitizedBody = sanitizePostBody(parsed.data.body);
  // サムネ未指定（＝エディタからの画像アップロードなし）の場合は本文1枚目の画像を使う。
  // アメブロ等からコピペされた外部画像の記事でもサムネが付くようにするフォールバック。
  const thumbnailUrl =
    parsed.data.thumbnailUrl ??
    sanitizedBody.match(/<img[^>]*src="(https?:[^"]+)"/)?.[1] ??
    null;
  const supabase = createSupabaseServer();
  const id = input.id;

  // 存在すれば update / なければ insert（id はエディタ採番済み）
  const { data: cur } = await supabase.from("posts")
    .select("author_id,status,published_at").eq("id", id).maybeSingle();

  if (cur) {
    // 既存: 所有者チェック（RLS でも守られるがメッセージのため事前確認）
    if (cur.author_id !== profile.userId && profile.role !== "admin") {
      return { ok: false, error: "この記事を編集する権限がありません" };
    }
    const { error } = await supabase.from("posts").update({
      title: parsed.data.title,
      body: sanitizedBody,
      tags: parsed.data.tags,
      thumbnail_url: thumbnailUrl,
      ...(input.publish
        ? { status: "published", published_at: cur.published_at ?? new Date().toISOString() }
        : {}),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
      console.error("savePost update failed:", error);
      return { ok: false, error: "保存に失敗しました。時間をおいて再度お試しください" };
    }
    // 既に公開済みの記事は下書き保存であってもライブ記事を直接書き換えるため再検証が必要
    if (input.publish || cur.status === "published") {
      revalidatePath("/blog");
      revalidateTag("posts");
      revalidatePath(`/blog/${id}`);
      revalidatePath("/");
    }
  } else {
    const { error } = await supabase.from("posts").insert({
      id,
      title: parsed.data.title,
      body: sanitizedBody,
      tags: parsed.data.tags,
      thumbnail_url: thumbnailUrl,
      author_id: profile.userId,
      status: input.publish ? "published" : "draft",
      published_at: input.publish ? new Date().toISOString() : null,
    });
    if (error) {
      console.error("savePost insert failed:", error);
      return { ok: false, error: "保存に失敗しました。時間をおいて再度お試しください" };
    }
    if (input.publish) {
      revalidatePath("/blog");
      revalidateTag("posts");
      revalidatePath(`/blog/${id}`);
      revalidatePath("/");
    }
  }

  return { ok: true, id };
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  const profile = await getProfile();
  if (!profile) return { ok: false, error: "ログインしてください" };
  const supabase = createSupabaseServer();
  const { data: cur } = await supabase.from("posts")
    .select("author_id").eq("id", id).maybeSingle();
  if (!cur) return { ok: false, error: "記事が見つかりません" };
  if (cur.author_id !== profile.userId && profile.role !== "admin") {
    return { ok: false, error: "この記事を削除する権限がありません" };
  }
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    console.error("deletePost failed:", error);
    return { ok: false, error: "削除に失敗しました" };
  }
  revalidatePath("/blog");
  revalidateTag("posts");
  revalidatePath(`/blog/${id}`);
  revalidatePath("/");
  return { ok: true };
}
