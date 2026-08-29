// スキ♡ボタンの演出用・純ロジック（UIに依存しないのでユニットテスト対象）

// スキした瞬間に吹き出しで出すお礼メッセージ（noteの「スキありがとう」を模す）
export const THANKS_MESSAGES = [
  "スキありがとう😊",
  "うれしいです！",
  "励みになります🥍",
  "また読んでください！",
  "最高の応援です📣",
] as const;

export type ThanksMessage = (typeof THANKS_MESSAGES)[number];

// rand は [0,1) を想定（省略時は Math.random()）。範囲外は端のメッセージにクランプ。
export function pickThanksMessage(rand: number = Math.random()): ThanksMessage {
  const i = Math.min(
    THANKS_MESSAGES.length - 1,
    Math.max(0, Math.floor(rand * THANKS_MESSAGES.length))
  );
  return THANKS_MESSAGES[i];
}

// パーティクルバーストの飛散ベクトル。真上（-90°）を起点に均等な角度で放射状に配置する。
export type ParticleVector = { x: number; y: number };

export function particleVectors(count: number, distance: number): ParticleVector[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((-90 + (360 / count) * i) * Math.PI) / 180;
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  });
}
