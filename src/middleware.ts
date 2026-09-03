import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LEGACY_HOSTS, legacyTarget } from "@/lib/legacy-redirects";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = (request.headers.get("host") ?? "").toLowerCase();

  // 旧サイト(agulaxmen.com)からの流入を新サイトの対応ページへ301転送
  const isLegacyHost = LEGACY_HOSTS.has(host);
  const target = legacyTarget(pathname, isLegacyHost);
  if (target) {
    return NextResponse.redirect(new URL(target, "https://aoyamaeagles.com"), 301);
  }

  // /admin 以外は認証チェック不要（Supabase呼び出しを避ける）
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/admin/login" || path === "/admin/signup";
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // 旧サイト転送のため全ページで実行（静的アセットは除外）。/admin以外は即returnで軽量
  matcher: ["/((?!_next/|img/|favicon|icon|apple-icon|robots|sitemap|api/).*)"],
};
