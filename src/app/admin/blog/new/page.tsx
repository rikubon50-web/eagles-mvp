import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import PostEditor from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function AdminBlogNewPage() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">新規記事作成</h1>
      <PostEditor initial={null} />
    </div>
  );
}
