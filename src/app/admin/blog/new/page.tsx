import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import PostEditor from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function AdminBlogNewPage() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  // note風の全画面キャンバス（レイアウトは PostEditor 側が持つ）
  return <PostEditor initial={null} />;
}
