const COLOR_MAP: Record<string, string> = {
  "お知らせ": "bg-sky-600",
  "新歓":     "bg-emerald-600",
  "試合情報": "bg-amber-600",
};

export function newsCategoryColor(category?: string): string {
  if (!category) return "bg-slate-500";
  return COLOR_MAP[category] ?? "bg-slate-500";
}
