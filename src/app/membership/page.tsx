"use client";

import { useState } from "react";

function Badge({ children, type = "required" }: { children: React.ReactNode; type?: "required" | "optional" }) {
  const isRequired = type === "required";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm px-3 py-1 text-xs font-bold tracking-widest select-none mr-3
        ${isRequired ? "bg-red-600 text-white" : "bg-slate-400 text-white"}
      `}
      aria-label={isRequired ? "必須" : "任意"}
    >
      {children}
    </span>
  );
}

export default function ContactPage() {
  type Step = "edit" | "confirm";

  const [step, setStep] = useState<Step>("edit");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [membershipType, setMembershipType] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "名前は必須です";
    if (!email.trim()) next.email = "メールアドレスは必須です";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "メールアドレスの形式が正しくありません";
    if (!address.trim()) next.address = "住所は必須です";
    if (!membershipType.trim()) next.membershipType = "会員種別は必須です";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // 1) 入力画面の送信 => 確認画面へ
  const onSubmitToConfirm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDone(false);
    if (!validate()) return;
    setStep("confirm");
    // ページ上部へ
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 2) 確認画面の送信 => API へ POST
  const onSubmitFinal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setErrors({});
    try {
      const res = await fetch("/api/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, address, membershipType, supportMessage }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.errors) setErrors(data.errors);
        else setErrors({ form: "送信中にエラーが発生しました。時間をおいて再度お試しください。" });
        return;
      }
      // 成功 => 完了表示 & 入力内容をクリア & 入力画面に戻す
      setDone(true);
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setMembershipType("");
      setSupportMessage("");
      setStep("edit");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setErrors({ form: "送信中にエラーが発生しました。時間をおいて再度お試しください。" });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 md:px-8">
      <header className="pt-8 md:pt-12">
        <h1 className="section-title text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">NEST入会フォーム</h1>
        <p className="mt-2 text-slate-600">ご意見・ご質問は以下のフォームからお寄せください。</p>
      </header>

      {/* 完了メッセージ */}
      {done && step === "edit" && (
        <div className="mt-6 rounded-md border border-[#0f6536]/30 bg-[#0f6536]/5 px-4 py-3 text-[#0f6536]">
          入会登録が完了しました。ご支援ありがとうございます！
        </div>
      )}

      {/* ---- 入力画面 ---- */}
      {step === "edit" && (
        <form onSubmit={onSubmitToConfirm} className="mt-8 md:mt-12 space-y-8">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              <Badge>必須</Badge>
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 花子"
              className={`w-full rounded-md border bg-slate-50 px-4 py-4 text-lg outline-none transition
                ${errors.name ? "border-red-500" : "border-slate-300 focus:border-[#0f6536]"}
              `}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "err-name" : undefined}
            />
            {errors.name && (
              <p id="err-name" className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              <Badge>必須</Badge>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@example.com"
              className={`w-full rounded-md border bg-slate-50 px-4 py-4 text-lg outline-none transition
                ${errors.email ? "border-red-500" : "border-slate-300 focus:border-[#0f6536]"}
              `}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "err-email" : undefined}
            />
            {errors.email && (
              <p id="err-email" className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              <Badge type="optional">任意</Badge>
              電話番号
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="000-0000-0000"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-4 text-lg outline-none focus:border-[#0f6536]"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              <Badge>必須</Badge>
              住所
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="東京都渋谷区〇〇町1-2-3"
              className={`w-full rounded-md border bg-slate-50 px-4 py-4 text-lg outline-none transition
                ${errors.address ? "border-red-500" : "border-slate-300 focus:border-[#0f6536]"}
              `}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "err-address" : undefined}
            />
            {errors.address && (
              <p id="err-address" className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Membership Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              <Badge>必須</Badge>
              会員種別
            </label>
            <select
              value={membershipType}
              onChange={(e) => setMembershipType(e.target.value)}
              className={`w-full rounded-md border bg-slate-50 px-4 py-4 text-lg outline-none transition
                ${errors.membershipType ? "border-red-500" : "border-slate-300 focus:border-[#0f6536]"}
              `}
              aria-invalid={Boolean(errors.membershipType)}
              aria-describedby={errors.membershipType ? "err-membershipType" : undefined}
            >
              <option value="">選択してください</option>
              <option value="学生">学生</option>
              <option value="OB・保護者">OB・保護者</option>
              <option value="一般サポーター">一般サポーター</option>
            </select>
            {errors.membershipType && (
              <p id="err-membershipType" className="mt-1 text-sm text-red-600">{errors.membershipType}</p>
            )}
          </div>

          {/* Support Message (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              <Badge type="optional">任意</Badge>
              応援メッセージ
            </label>
            <textarea
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="応援メッセージをお書きください"
              rows={6}
              className="w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-4 py-4 text-lg outline-none focus:border-[#0f6536]"
            />
          </div>

          {/* Note */}
          <p className="text-sm text-slate-600">
            確認画面が表示されます。内容をご確認のうえ、送信へお進みください。
          </p>

          {/* Actions */}
          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border-2 border-[#0f6536] px-8 py-3 text-lg font-bold tracking-wide text-[#0f6536] hover:text-white hover:bg-[#0f6536]"
            >
              確認する
            </button>
          </div>
        </form>
      )}

      {/* ---- 確認画面 ---- */}
      {step === "confirm" && (
        <form onSubmit={onSubmitFinal} className="mt-8 md:mt-12 space-y-6">
          <div className="rounded-lg border border-slate-300 bg-white">
            <div className="border-b px-4 py-3 font-semibold text-slate-800">入力内容の確認</div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-500">名前</div>
                <div className="mt-1 text-lg">{name}</div>
              </div>
              <div className="border-t pt-4">
                <div className="text-xs font-semibold text-slate-500">メールアドレス</div>
                <div className="mt-1 text-lg">{email}</div>
              </div>
              <div className="border-t pt-4">
                <div className="text-xs font-semibold text-slate-500">電話番号</div>
                <div className="mt-1 text-lg">{phone || "-"}</div>
              </div>
              <div className="border-t pt-4">
                <div className="text-xs font-semibold text-slate-500">住所</div>
                <div className="mt-1 text-lg">{address}</div>
              </div>
              <div className="border-t pt-4">
                <div className="text-xs font-semibold text-slate-500">会員種別</div>
                <div className="mt-1 text-lg">{membershipType}</div>
              </div>
              <div className="border-t pt-4">
                <div className="text-xs font-semibold text-slate-500">応援メッセージ</div>
                <p className="mt-1 whitespace-pre-wrap text-lg leading-7">{supportMessage || "-"}</p>
              </div>
            </div>
          </div>

          {errors.form && (
            <p className="text-sm text-red-600">{errors.form}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep("edit")}
              className="inline-flex items-center gap-2 rounded-md border px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              修正する
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-md border-2 border-[#0f6536] px-8 py-3 text-lg font-bold tracking-wide text-[#0f6536] hover:text-white hover:bg-[#0f6536] disabled:opacity-50"
            >
              {sending ? "送信中..." : "送信する"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}