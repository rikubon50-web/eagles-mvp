// src/app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const image = form.get("image") as File | null;
  const thumb = form.get("thumb") as File | null;
  const postId = String(form.get("postId") ?? "");
  if (!image || !thumb || !/^[a-z0-9_-]{1,64}$/i.test(postId)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (image.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "画像が大きすぎます（5MBまで）" }, { status: 413 });
  }
  const ts = Date.now();
  const base = `${user.id}/${postId}/${ts}`;
  const up1 = await supabase.storage.from("blog-images")
    .upload(`${base}.jpg`, image, { contentType: "image/jpeg" });
  if (up1.error) return NextResponse.json({ error: up1.error.message }, { status: 500 });
  const up2 = await supabase.storage.from("blog-images")
    .upload(`${base}-thumb.jpg`, thumb, { contentType: "image/jpeg" });
  if (up2.error) return NextResponse.json({ error: up2.error.message }, { status: 500 });

  const pub = (p: string) => supabase.storage.from("blog-images").getPublicUrl(p).data.publicUrl;
  return NextResponse.json({ url: pub(`${base}.jpg`), thumbUrl: pub(`${base}-thumb.jpg`) });
}
