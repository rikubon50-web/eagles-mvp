"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import { prepareImageForUpload } from "@/lib/image-client";
import { newPostId } from "@/lib/posts-domain";
import { savePost } from "./actions";
import { useRouter } from "next/navigation";

type InitialPost = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  thumbnailUrl: string | null;
};

const COLORS = [
  "#0f172a", "#dc2626", "#ea580c", "#ca8a04",
  "#16a34a", "#0f6536", "#2563eb", "#7c3aed",
];

const FONT_SIZES: { label: string; value: string | null }[] = [
  { label: "小", value: "0.85em" },
  { label: "標準", value: null },
  { label: "大", value: "1.4em" },
];

const PROSE_CLASS =
  "prose prose-slate prose-headings:font-bold prose-a:text-[#0f6536] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-img:mt-4 max-w-none min-h-[16rem] focus:outline-none px-4 py-3";

// 本文 HTML 先頭の <img src="..."> を抜き出す
function firstImageSrc(html: string): string | null {
  const m = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

export default function PostEditor({ initial }: { initial: InitialPost | null }) {
  const router = useRouter();
  // 新規時のみ id を採番し、以後は同じ値を画像アップロードと savePost で使い回す
  const [postId] = useState(() => initial?.id ?? newPostId());

  const [title, setTitle] = useState(initial?.title ?? "");
  const [tagsText, setTagsText] = useState(initial?.tags?.join(", ") ?? "ブログ");
  // アップロードした画像の url → thumbUrl 対応表
  const [thumbMap, setThumbMap] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        link: { openOnClick: false, autolink: false },
      }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      FontSize,
    ],
    content: initial?.body ?? "",
    editorProps: {
      attributes: { class: PROSE_CLASS },
    },
  });

  const tags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsText]
  );

  const insertImage = async (file: File) => {
    if (!editor) return;
    setUploading(true);
    setError(null);
    try {
      const { image, thumb } = await prepareImageForUpload(file);
      const form = new FormData();
      form.append("image", image, "image.jpg");
      form.append("thumb", thumb, "thumb.jpg");
      form.append("postId", postId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "画像のアップロードに失敗しました");
      }
      const { url, thumbUrl } = (await res.json()) as { url: string; thumbUrl: string };
      setThumbMap((m) => ({ ...m, [url]: thumbUrl }));
      editor.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      setError(e instanceof Error ? e.message : "画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void insertImage(file);
    e.target.value = "";
  };

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("リンク先URLを入力してください", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const save = (publish: boolean) => {
    if (!editor) return;
    setError(null);
    const body = editor.getHTML();
    const firstSrc = firstImageSrc(body);
    const thumbnailUrl = (firstSrc && thumbMap[firstSrc]) || initial?.thumbnailUrl || null;

    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }

    startTransition(async () => {
      const result = await savePost({ id: postId, title, body, tags, thumbnailUrl, publish });
      if (result.ok) {
        router.push("/admin/blog");
      } else {
        setError(result.error);
      }
    });
  };

  if (!editor) return null;

  const btnCls = (active: boolean) =>
    `px-2.5 py-1.5 rounded text-sm font-semibold ${
      active ? "bg-emerald-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
    } border border-slate-300`;

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル"
        className="w-full rounded border border-slate-300 px-3 py-2 text-lg font-bold"
      />

      <div className="rounded-xl border border-slate-300 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <button type="button" className={btnCls(editor.isActive("bold"))}
            onClick={() => editor.chain().focus().toggleBold().run()}>太字</button>
          <button type="button" className={btnCls(editor.isActive("heading", { level: 2 }))}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>見出し</button>
          <button type="button" className={btnCls(editor.isActive("bulletList"))}
            onClick={() => editor.chain().focus().toggleBulletList().run()}>箇条書き</button>
          <button type="button" className={btnCls(editor.isActive({ textAlign: "center" }))}
            onClick={() => editor.chain().focus().toggleTextAlign("center").run()}>中央寄せ</button>
          <button type="button" className={btnCls(editor.isActive("link"))} onClick={setLink}>リンク</button>

          <span className="mx-1 h-5 w-px bg-slate-300" />
          {FONT_SIZES.map(({ label, value }) => (
            <button key={label} type="button"
              className={btnCls(editor.isActive("textStyle", { fontSize: value }))}
              onClick={() =>
                value
                  ? editor.chain().focus().setFontSize(value).run()
                  : editor.chain().focus().unsetFontSize().run()
              }>
              {label}
            </button>
          ))}

          <span className="mx-1 h-5 w-px bg-slate-300" />
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={`文字色 ${c}`}
                className="h-6 w-6 rounded-full border border-slate-300"
                style={{ backgroundColor: c }}
                onClick={() => editor.chain().focus().setColor(c).run()} />
            ))}
          </div>

          <span className="mx-1 h-5 w-px bg-slate-300" />
          <button type="button" className={btnCls(false)} disabled={uploading}
            onClick={() => fileInputRef.current?.click()}>
            {uploading ? "アップロード中..." : "画像挿入"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={handleFileChange} />
        </div>

        <EditorContent editor={editor} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">タグ（カンマ区切り）</label>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="ブログ, 試合"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      {error && (
        <p role="status" className="rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" disabled={isPending}
          onClick={() => save(false)}
          className="rounded border border-slate-400 text-slate-700 px-6 py-3 font-bold disabled:opacity-50">
          下書き保存
        </button>
        <button type="button" disabled={isPending}
          onClick={() => save(true)}
          className="rounded bg-slate-900 text-white px-6 py-3 font-bold disabled:opacity-50">
          {isPending ? "保存中..." : "公開する"}
        </button>
      </div>
    </div>
  );
}
