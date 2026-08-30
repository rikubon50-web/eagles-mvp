"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { prepareLogoForUpload } from "@/lib/image-client";
import { saveGame } from "./actions";

export type InitialGame = {
  id: string;
  title: string;
  startAt: string; // ISO
  venue: string;
  opponent: string;
  status: "scheduled" | "live" | "finished" | "postponed";
  ourScore: number | null;
  oppScore: number | null;
  note: string;
  opponentLogoUrl: string | null;
};

const STATUS_OPTIONS: { value: InitialGame["status"]; label: string }[] = [
  { value: "scheduled", label: "予定" },
  { value: "live", label: "試合中" },
  { value: "finished", label: "終了" },
  { value: "postponed", label: "延期" },
];

// ISO文字列 → datetime-local入力値（ブラウザのローカル時刻＝JST前提）
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GameForm({ initial }: { initial: InitialGame | null }) {
  const router = useRouter();
  const [uploadId] = useState(() => initial?.id ?? `logo-${crypto.randomUUID().slice(0, 8)}`);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [startAtLocal, setStartAtLocal] = useState(
    initial ? isoToLocalInput(initial.startAt) : ""
  );
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [opponent, setOpponent] = useState(initial?.opponent ?? "");
  const [status, setStatus] = useState<InitialGame["status"]>(initial?.status ?? "scheduled");
  const [ourScore, setOurScore] = useState(initial?.ourScore != null ? String(initial.ourScore) : "");
  const [oppScore, setOppScore] = useState(initial?.oppScore != null ? String(initial.oppScore) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.opponentLogoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await prepareLogoForUpload(file);
      const form = new FormData();
      form.append("image", blob, "logo.png");
      form.append("postId", uploadId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "画像のアップロードに失敗しました");
      }
      const { url } = (await res.json()) as { url: string };
      setLogoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const parseScore = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const save = () => {
    setError(null);
    if (!startAtLocal) {
      setError("日時を入力してください");
      return;
    }
    let startAtIso: string;
    try {
      startAtIso = new Date(startAtLocal).toISOString();
      if (Number.isNaN(new Date(startAtIso).getTime())) throw new Error("invalid");
    } catch {
      setError("日時の形式が正しくありません");
      return;
    }

    startTransition(async () => {
      const result = await saveGame({
        id: initial?.id ?? null,
        title,
        startAt: startAtIso,
        venue,
        opponent,
        status,
        ourScore: parseScore(ourScore),
        oppScore: parseScore(oppScore),
        note,
        opponentLogoUrl: logoUrl,
      });
      if (result.ok) {
        router.push("/admin/games");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">日時</label>
        <input
          type="datetime-local"
          value={startAtLocal}
          onChange={(e) => setStartAtLocal(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">大会名</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="関東学生リーグ戦"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">会場</label>
        <input
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">相手校</label>
        <input
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">相手ロゴ（任意）</label>
        <div className="flex items-center gap-3">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="相手ロゴプレビュー" className="h-16 w-16 rounded object-contain border border-slate-200" />
          )}
          <input type="file" accept="image/*" disabled={uploading} onChange={handleLogoChange} />
          {logoUrl && (
            <button
              type="button"
              onClick={() => setLogoUrl(null)}
              className="text-sm text-red-600 underline"
            >
              削除
            </button>
          )}
        </div>
        {uploading && <p className="text-xs text-slate-400 mt-1">アップロード中...</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">ステータス</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InitialGame["status"])}
          className="w-full rounded border border-slate-300 px-3 py-2"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {(status === "finished" || status === "live") && (
        <div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-600 mb-1">自チーム得点</label>
              <input
                type="text"
                inputMode="numeric"
                value={ourScore}
                onChange={(e) => setOurScore(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-600 mb-1">相手得点</label>
              <input
                type="text"
                inputMode="numeric"
                value={oppScore}
                onChange={(e) => setOppScore(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
          {status === "live" && (
            <p className="text-xs text-slate-400 mt-1">
              試合中はスコア空欄のまま保存できます（未入力は公開ページで「-」表示）
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">備考</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      {error && (
        <p role="status" className="rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={isPending || uploading}
          onClick={save}
          className="rounded bg-slate-900 text-white px-6 py-3 font-bold disabled:opacity-50"
        >
          {isPending ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}
