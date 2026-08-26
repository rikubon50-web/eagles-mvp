import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import PostEditor from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function AdminBlogEditPage({ params }: { params: { id: string } }) {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  const supabase = createSupabaseServer();
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, title, body, tags, thumbnail_url, author_id")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("AdminBlogEditPage: post fetch failed", error);
  }

  if (!post || (post.author_id !== profile.userId && profile.role !== "admin")) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">記事編集</h1>
      <PostEditor
        initial={{
          id: post.id,
          title: post.title,
          body: post.body,
          tags: post.tags,
          thumbnailUrl: post.thumbnail_url,
        }}
      />
    </div>
  );
}
