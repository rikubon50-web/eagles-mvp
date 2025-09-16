// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  // シークレット確認
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { revalidated: false, message: "Invalid secret" },
      { status: 401 }
    );
  }

  try {
    // 再生成したいページを列挙
    revalidatePath("/");       // トップページ
    revalidatePath("/news");   // ニュース一覧
    revalidatePath("/games");  // 試合一覧

    // 詳細ページは payload から slug/id を取って呼ぶのが理想
    // 例:
    // const body = await req.json();
    // if (body.api === "news" && body.contents?.slug) {
    //   revalidatePath(`/news/${body.contents.slug}`);
    // }
    // if (body.api === "games" && body.id) {
    //   revalidatePath(`/games/${body.id}`);
    // }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { revalidated: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}