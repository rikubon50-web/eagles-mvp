// src/components/Pagination.tsx
import Link from "next/link";

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.tag) sp.set("tag", params.tag);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

// ページ番号の表示ウィンドウ（現在ページを中心に最大5個）
function pageWindowNumbers(page: number, pageCount: number, size = 5): number[] {
  let start = Math.max(1, page - Math.floor(size / 2));
  const end = Math.min(pageCount, start + size - 1);
  start = Math.max(1, end - size + 1);
  const nums: number[] = [];
  for (let p = start; p <= end; p++) nums.push(p);
  return nums;
}

export default function Pagination({
  page,
  pageCount,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params: { q?: string; tag?: string };
}) {
  if (pageCount <= 1) return null;

  const nums = pageWindowNumbers(page, pageCount);

  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="ページネーション">
      {page > 1 ? (
        <Link
          href={buildHref(basePath, params, page - 1)}
          className="px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-300 text-slate-600 hover:border-[#0f6536] hover:text-[#0f6536] transition-colors"
        >
          前へ
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 text-slate-300 cursor-not-allowed">
          前へ
        </span>
      )}

      {nums.map((n) => (
        <Link
          key={n}
          href={buildHref(basePath, params, n)}
          aria-current={n === page ? "page" : undefined}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
            n === page
              ? "bg-[#0f6536] text-white border-[#0f6536]"
              : "bg-white text-slate-600 border-slate-300 hover:border-[#0f6536] hover:text-[#0f6536]"
          }`}
        >
          {n}
        </Link>
      ))}

      {page < pageCount ? (
        <Link
          href={buildHref(basePath, params, page + 1)}
          className="px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-300 text-slate-600 hover:border-[#0f6536] hover:text-[#0f6536] transition-colors"
        >
          次へ
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 text-slate-300 cursor-not-allowed">
          次へ
        </span>
      )}
    </nav>
  );
}
