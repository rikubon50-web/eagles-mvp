import { describe, it, expect } from "vitest";
import { THANKS_MESSAGES, pickThanksMessage, particleVectors } from "@/lib/like-messages";

describe("pickThanksMessage", () => {
  it("rand=0 で先頭のメッセージを返す", () => {
    expect(pickThanksMessage(0)).toBe(THANKS_MESSAGES[0]);
  });
  it("rand≈1 で末尾のメッセージを返す", () => {
    expect(pickThanksMessage(0.999999)).toBe(THANKS_MESSAGES[THANKS_MESSAGES.length - 1]);
  });
  it("同じ rand なら同じメッセージ（決定的）", () => {
    expect(pickThanksMessage(0.42)).toBe(pickThanksMessage(0.42));
  });
  it("常にリスト内のメッセージを返す", () => {
    for (const r of [0, 0.1, 0.25, 0.5, 0.77, 0.999]) {
      expect(THANKS_MESSAGES).toContain(pickThanksMessage(r));
    }
  });
  it("範囲外の rand は端にクランプされる", () => {
    expect(pickThanksMessage(1)).toBe(THANKS_MESSAGES[THANKS_MESSAGES.length - 1]);
    expect(pickThanksMessage(-0.5)).toBe(THANKS_MESSAGES[0]);
  });
});

describe("particleVectors", () => {
  it("指定した個数のベクトルを返す", () => {
    expect(particleVectors(8, 40)).toHaveLength(8);
  });
  it("最初のパーティクルは真上（x≈0, y=-distance）に飛ぶ", () => {
    const [first] = particleVectors(6, 40);
    expect(first.x).toBeCloseTo(0, 6);
    expect(first.y).toBeCloseTo(-40, 6);
  });
  it("すべて原点から distance の距離にある（放射状）", () => {
    for (const v of particleVectors(7, 32)) {
      expect(Math.hypot(v.x, v.y)).toBeCloseTo(32, 6);
    }
  });
});
