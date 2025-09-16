// src/lib/format.ts

/** 日本語ロケールで日時を短く表示（例: 2025/9/10 18:30） */
export const fmtDateTimeJP = (iso: string) =>
  new Date(iso).toLocaleString("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  });

/** 日付のみ（例: 2025/09/10） */
export const fmtDateJP = (iso: string) =>
  new Date(iso).toLocaleDateString("ja-JP");

/** 時刻のみ（例: 18:30） */
export const fmtTimeJP = (iso: string) =>
  new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

/** ISOかどうか怪しい値にも一応耐えるガード */
export const safeDate = (value: string | Date) =>
  typeof value === "string" ? new Date(value) : value;