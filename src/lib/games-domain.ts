import { z } from "zod";

const score = z.number().int().min(0).nullable();

export const gameInputSchema = z
  .object({
    title: z.string().trim().min(1, "大会名を入力してください").max(120),
    startAt: z.string().min(1, "日時を入力してください"),
    venue: z.string().trim().max(120),
    opponent: z.string().trim().min(1, "相手校を入力してください").max(60),
    status: z.enum(["scheduled", "finished", "postponed"]),
    ourScore: score,
    oppScore: score,
    note: z.string().max(2000),
  })
  .superRefine((v, ctx) => {
    if (v.status === "finished" && (v.ourScore == null || v.oppScore == null)) {
      ctx.addIssue({ code: "custom", message: "終了した試合は両チームのスコアが必要です", path: ["ourScore"] });
    }
  })
  .transform((v) =>
    v.status === "finished" ? v : { ...v, ourScore: null, oppScore: null }
  );
export type GameInput = z.infer<typeof gameInputSchema>;

export function deriveResult(
  status: string, ourScore: number | null, oppScore: number | null
): "win" | "lose" | "draw" | null {
  if (status !== "finished" || ourScore == null || oppScore == null) return null;
  if (ourScore > oppScore) return "win";
  if (ourScore < oppScore) return "lose";
  return "draw";
}
