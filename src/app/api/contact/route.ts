// src/app/api/contact/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, phone, email, message } = await req.json();

    // サーバー側でも軽くバリデーション（保険）
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const text = [
      "📩 *お問い合わせが届きました*",
      `*お名前*: ${name}`,
      phone ? `*電話*: ${phone}` : "",
      `*メール*: ${email}`,
      `*内容*:`,
      "```",
      message,
      "```",
      `受信: ${new Date().toLocaleString("ja-JP")}`,
    ].filter(Boolean).join("\n");

    const res = await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("SLACK_ERROR", res.status, body);
      return NextResponse.json({ ok: false }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}