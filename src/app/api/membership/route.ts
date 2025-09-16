// Membership application endpoint (Slack notify + Auto-reply email)
import { NextResponse } from "next/server";

type AnyObj = Record<string, any>;

// --- helpers ---
const has = (v: any) => typeof v === "string" && v.trim().length > 0;

async function postToSlack(payload: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  memberType: string;
  message?: string;
}) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return; // optional

  const lines = [
    "🪶 *NEST 入会申込が届きました*",
    `*お名前*: ${payload.name}`,
    `*メール*: ${payload.email}`,
    payload.phone ? `*電話*: ${payload.phone}` : "",
    payload.address ? `*住所*: ${payload.address}` : "",
    `*会員種別*: ${payload.memberType}`,
    payload.message ? "*応援メッセージ*:\n```" + payload.message + "```" : "",
    `受信: ${new Date().toLocaleString("ja-JP")}`,
  ].filter(Boolean);

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });
  } catch (e) {
    console.error("SLACK_ERROR", e);
  }
}

async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "no-reply@example.com";
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Skip email sending.");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("RESEND_ERROR", res.status, body);
    }
  } catch (e) {
    console.error("RESEND_EXCEPTION", e);
  }
}

export async function POST(req: Request) {
  try {
    const raw: AnyObj = await req.json().catch(() => ({} as AnyObj));

    // フロントのキー揺れを吸収
    const name = (raw.name ?? "").toString().trim();
    const email = (raw.email ?? "").toString().trim();
    const phone = (raw.phone ?? raw.tel ?? "").toString().trim();
    const address = (raw.address ?? "").toString().trim(); // 任意
    const memberType = (raw.memberType ?? raw.membershipType ?? "").toString().trim();
    const message = (raw.message ?? raw.supportMessage ?? "").toString();

    // 必須: name / email / memberType
    const missing: string[] = [];
    if (!has(name)) missing.push("name");
    if (!has(email)) missing.push("email");
    if (!has(memberType)) missing.push("memberType");

    if (missing.length) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload", missing },
        { status: 400 }
      );
    }

    // Slack 送信（失敗してもレスポンスは継続）
    postToSlack({ name, email, phone, address, memberType, message });

    // 口座情報（.env から）
    const BANK_NAME = process.env.BANK_NAME ?? "";
    const BANK_BRANCH = process.env.BANK_BRANCH ?? "";
    const BANK_ACCOUNT_TYPE = process.env.BANK_ACCOUNT_TYPE ?? "";
    const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER ?? "";
    const BANK_ACCOUNT_NAME = process.env.BANK_ACCOUNT_NAME ?? "";

    const subject = "【EAGLES NEST】入会申請を受け付けました（お振込のご案内）";

    const bankBlock = `
      <table style="width:100%;max-width:560px;border:1px solid #e5e7eb;border-collapse:collapse">
        <tbody>
          <tr>
            <th style="text-align:left;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e5e7eb;width:40%">銀行名</th>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${BANK_NAME}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e5e7eb">支店</th>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${BANK_BRANCH}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e5e7eb">種別</th>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${BANK_ACCOUNT_TYPE}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e5e7eb">口座番号</th>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${BANK_ACCOUNT_NUMBER}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:10px 12px;background:#f8fafc;">口座名義</th>
            <td style="padding:10px 12px;">${BANK_ACCOUNT_NAME}</td>
          </tr>
        </tbody>
      </table>
    `;

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.7;color:#0f172a">
        <p>${name} 様</p>
        <p>EAGLES NEST への入会申請を受け付けました。<br/>下記口座へ年会費のご入金をお願いいたします。</p>
        ${bankBlock}
        <p style="margin-top:16px">入金の確認ができ次第、会員登録の完了メールをお送りします。</p>
        <p style="margin-top:16px">なお下記のご登録内容に誤りがある場合はHPからお問い合わせ下さい。</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:14px;color:#475569;margin:0">ご登録内容</p>
        <ul style="font-size:14px;color:#334155;margin:8px 0 0 0;padding:0 0 0 16px">
          <li>お名前：${name}</li>
          <li>メール：${email}</li>
          <li>電話番号：${phone || "-"}</li>
          <li>住所：${address || "-"}</li>
          <li>会員種別：${memberType}</li>
        </ul>
        ${message ? `<p style="font-size:14px;color:#334155">メッセージ：${message}</p>` : ""}
        <p style="margin-top:24px;font-size:12px;color:#64748b">本メールにお心当たりがない場合は破棄してください。</p>
      </div>
    `;

    const text = [
      `${name} 様`,
      "",
      "EAGLES NEST への入会申請を受け付けました。下記口座へ年会費のご入金をお願いいたします。",
      "",
      `銀行名：${BANK_NAME}`,
      `支店：${BANK_BRANCH}`,
      `種別：${BANK_ACCOUNT_TYPE}`,
      `口座番号：${BANK_ACCOUNT_NUMBER}`,
      `口座名義：${BANK_ACCOUNT_NAME}`,
      "",
      "— ご登録内容 —",
      `お名前：${name}`,
      `メール：${email}`,
      `電話番号：${phone || "-"}`,
      `住所：${address || "-"}`,
      `会員種別：${memberType}`,
      message ? `メッセージ：${message}` : "",
    ].join("\n");

    // メール送信は fire-and-forget
    sendEmail(email, subject, html, text);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Membership POST error:", e);
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}