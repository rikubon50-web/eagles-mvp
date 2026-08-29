import { getProfile } from "@/lib/auth";
import AdminNav from "./AdminNav";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-slate-50">
      {profile && <AdminNav role={profile.role} />}
      {children}
    </div>
  );
}
