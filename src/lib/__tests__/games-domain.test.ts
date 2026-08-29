import { describe, it, expect } from "vitest";
import { gameInputSchema, deriveResult } from "@/lib/games-domain";

const base = {
  title: "リーグ戦", startAt: "2026-09-10T13:00:00+09:00", venue: "大井",
  opponent: "早稲田大学", status: "scheduled", ourScore: null, oppScore: null, note: "", opponentLogoUrl: null,
};

describe("gameInputSchema", () => {
  it("予定試合を受理し、スコアはnullのまま", () => {
    const r = gameInputSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.ourScore).toBeNull();
  });
  it("finishedでスコア欠落は拒否", () => {
    expect(gameInputSchema.safeParse({ ...base, status: "finished", ourScore: 5 }).success).toBe(false);
  });
  it("finishedで両スコアありは受理", () => {
    expect(gameInputSchema.safeParse({ ...base, status: "finished", ourScore: 5, oppScore: 3 }).success).toBe(true);
  });
  it("scheduledに入ったスコアはnullへ正規化", () => {
    const r = gameInputSchema.safeParse({ ...base, ourScore: 4, oppScore: 2 });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.ourScore).toBeNull(); expect(r.data.oppScore).toBeNull(); }
  });
  it("相手校空欄は拒否", () => {
    expect(gameInputSchema.safeParse({ ...base, opponent: " " }).success).toBe(false);
  });
  it("相手ロゴURLはnullでも有効なURLでも受理、不正文字列は拒否", () => {
    expect(gameInputSchema.safeParse({ ...base, opponentLogoUrl: "https://example.com/logo.jpg" }).success).toBe(true);
    expect(gameInputSchema.safeParse({ ...base, opponentLogoUrl: "not-a-url" }).success).toBe(false);
  });

  // --- live（試合中）ステータス ---
  it("liveを受理し、スコア両方nullのままでよい", () => {
    const r = gameInputSchema.safeParse({ ...base, status: "live" });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.ourScore).toBeNull(); expect(r.data.oppScore).toBeNull(); }
  });
  it("liveで片方だけのスコアも受理し、null化せず保持する", () => {
    const r = gameInputSchema.safeParse({ ...base, status: "live", ourScore: 3 });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.ourScore).toBe(3); expect(r.data.oppScore).toBeNull(); }
  });
  it("liveで両スコアありは値を保持する", () => {
    const r = gameInputSchema.safeParse({ ...base, status: "live", ourScore: 4, oppScore: 2 });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.ourScore).toBe(4); expect(r.data.oppScore).toBe(2); }
  });
});

describe("deriveResult", () => {
  it("勝ち", () => expect(deriveResult("finished", 8, 6)).toBe("win"));
  it("負け", () => expect(deriveResult("finished", 2, 9)).toBe("lose"));
  it("引き分け", () => expect(deriveResult("finished", 3, 3)).toBe("draw"));
  it("未終了はnull", () => expect(deriveResult("scheduled", null, null)).toBeNull());
  it("finishedでもスコアnullならnull", () => expect(deriveResult("finished", null, null)).toBeNull());
  it("liveは両スコアがあってもnull（勝敗は確定させない）", () =>
    expect(deriveResult("live", 5, 3)).toBeNull());
});
