"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import { prepareImageForUpload } from "@/lib/image-client";
import { newPostId } from "@/lib/posts-domain";
import { savePost } from "./actions";
import {
  EditorBubbleMenu,
  EditorFloatingMenu,
  MobileToolbar,
  useIsDesktop,
} from "./EditorToolbar";
import PublishSheet from "./PublishSheet";

type InitialPost = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  thumbnailUrl: string | null;
  status?: "draft" | "published";
};

const PROSE_CLASS =
  "prose prose-slate prose-headings:font-bold prose-a:text-[#0f6536] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-img:mt-4 max-w-none min-h-[50vh] focus:outline-none pt-2 pb-8";

// 上部バーの保存状態表示
type SaveState =
  | { kind: "idle" }
  | { kind: "dirty" }     // 未保存の変更
  | { kind: "untitled" }  // タイトル空で自動保存できない
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string };

const AUTOSAVE_DELAY_MS = 3000;
// 自動保存失敗時のリトライ間隔（一時的な通信失敗を1回だけ拾う）
const AUTOSAVE_RETRY_DELAY_MS = 30000;

// 本文 HTML 先頭の <img src="..."> を抜き出す
function firstImageSrc(html: string): string | null {
  const m = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function PostEditor({ initial }: { initial: InitialPost | null }) {
  const router = useRouter();
  // 新規時のみ id を採番し、以後は同じ値を画像アップロードと savePost で使い回す
  const [postId] = useState(() => initial?.id ?? newPostId());
  const isPublished = initial?.status === "published";
  // 公開済み記事は自動保存しない（書きかけが本番に出るため）
  const autosaveEnabled = !isPublished;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [tagsText, setTagsText] = useState(initial?.tags?.join(", ") ?? "ブログ");
  // アップロードした画像の url → thumbUrl 対応表
  const [thumbMap, setThumbMap] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, startPublish] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useIsDesktop();

  const tags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsText]
  );

  // タイマーコールバックから常に最新値を読むための ref 群
  const editorRef = useRef<Editor | null>(null);
  const titleRef = useRef(title);
  titleRef.current = title;
  const tagsRef = useRef(tags);
  tagsRef.current = tags;
  const thumbMapRef = useRef(thumbMap);
  thumbMapRef.current = thumbMap;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false); // savePost 実行中（自動保存・公開共通の直列化フラグ）
  const dirtyRef = useRef(false);  // 前回保存以降に変化があったか
  const publishedRef = useRef(false); // 公開成功後（遷移待ち）は自動保存を一切走らせない
  const retryRef = useRef(0);      // 自動保存失敗後の自動リトライ回数

  const currentThumbnailUrl = (body: string): string | null => {
    const firstSrc = firstImageSrc(body);
    return (firstSrc && thumbMapRef.current[firstSrc]) || initial?.thumbnailUrl || null;
  };

  // 下書き保存の実体（自動保存と明示「下書き保存」で共用）
  const runDraftSave = async (manual: boolean) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (publishedRef.current) return; // 公開直後に残ったタイマーからの迷子保存を防ぐ
    if (savingRef.current) return; // 実行中はスキップ（完了時に dirty なら再スケジュール）
    if (!titleRef.current.trim()) {
      // savePost が弾くため自動保存しない。明示保存時のみエラーを見せる
      setSaveState(
        manual
          ? { kind: "error", message: "タイトルを入力してください" }
          : { kind: "untitled" }
      );
      return;
    }
    savingRef.current = true;
    dirtyRef.current = false;
    setSaveState({ kind: "saving" });
    const body = editor.getHTML();
    let result: Awaited<ReturnType<typeof savePost>>;
    try {
      result = await savePost({
        id: postId,
        title: titleRef.current,
        body,
        tags: tagsRef.current,
        thumbnailUrl: currentThumbnailUrl(body),
        publish: false,
      });
    } catch {
      result = { ok: false, error: "保存に失敗しました。通信環境をご確認ください" };
    } finally {
      savingRef.current = false;
    }
    if (!result.ok) {
      dirtyRef.current = true;
      setSaveState({ kind: "error", message: result.error });
      // 一時的な通信失敗に備え、自動保存は少し置いて1回だけ自動リトライする
      if (!manual && autosaveEnabled && retryRef.current < 1) {
        retryRef.current += 1;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          void runDraftSaveRef.current(false);
        }, AUTOSAVE_RETRY_DELAY_MS);
      }
      return;
    }
    retryRef.current = 0;
    if (dirtyRef.current) {
      // 保存中に発生した変更を拾って再スケジュール
      setSaveState({ kind: "dirty" });
      if (autosaveEnabled) scheduleRef.current();
    } else {
      setSaveState({ kind: "saved", at: hhmm(new Date()) });
    }
  };

  const runDraftSaveRef = useRef(runDraftSave);
  runDraftSaveRef.current = runDraftSave;

  const scheduleAutosave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void runDraftSaveRef.current(false);
    }, AUTOSAVE_DELAY_MS);
  };
  const scheduleRef = useRef(scheduleAutosave);
  scheduleRef.current = scheduleAutosave;

  // title / body / tags の変化時に呼ぶ
  const markDirty = () => {
    dirtyRef.current = true;
    retryRef.current = 0; // 新しい編集が入ったらリトライ回数をリセット
    if (!savingRef.current) {
      setSaveState({ kind: titleRef.current.trim() ? "dirty" : "untitled" });
    }
    if (autosaveEnabled) scheduleAutosave();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 未保存の変更（保存実行中を含む）を残したままのリロード・タブ閉じを確認ダイアログで止める
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current || savingRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // 「← 記事一覧」クリック時の離脱確認（SPA遷移は beforeunload が効かないため）
  const confirmLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      (dirtyRef.current || savingRef.current) &&
      !window.confirm("未保存の変更があります。破棄して記事一覧に戻りますか？")
    ) {
      e.preventDefault();
    }
  };

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
      Placeholder.configure({ placeholder: "本文を書きましょう" }),
    ],
    content: initial?.body ?? "",
    editorProps: {
      attributes: { class: PROSE_CLASS },
    },
    onUpdate: () => markDirty(),
  });
  editorRef.current = editor;

  const insertImage = async (file: File) => {
    if (!editor) return;
    setUploading(true);
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
      setSaveState({
        kind: "error",
        message: e instanceof Error ? e.message : "画像のアップロードに失敗しました",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void insertImage(file);
    e.target.value = "";
  };

  const pickImage = () => fileInputRef.current?.click();

  const saveDraftNow = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void runDraftSave(true);
  };

  const openPublish = () => {
    setPublishError(null);
    setPublishOpen(true);
  };

  const publish = () => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!title.trim()) {
      setPublishError("タイトルを入力してください");
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    startPublish(async () => {
      // 進行中の自動保存を待って直列化（新規 insert の重複を避ける）
      while (savingRef.current) {
        await new Promise((r) => setTimeout(r, 100));
      }
      savingRef.current = true;
      dirtyRef.current = false;
      // 待機中に完了した自動保存が再アームしたタイマーをここで確実に潰す
      if (timerRef.current) clearTimeout(timerRef.current);
      const body = editor.getHTML();
      let result: Awaited<ReturnType<typeof savePost>>;
      try {
        result = await savePost({
          id: postId,
          title: titleRef.current,
          body,
          tags: tagsRef.current,
          thumbnailUrl: currentThumbnailUrl(body),
          publish: true,
        });
      } catch {
        result = { ok: false, error: "保存に失敗しました。通信環境をご確認ください" };
      } finally {
        savingRef.current = false;
      }
      if (result.ok) {
        publishedRef.current = true; // 遷移完了までの間に迷子の自動保存が走らないようにする
        router.push("/admin/blog");
      } else {
        setPublishError(result.error);
        // クリック時に落とした dirty と自動保存タイマーを復元し、変更を取りこぼさない
        dirtyRef.current = true;
        if (autosaveEnabled) scheduleRef.current();
      }
    });
  };

  const statusText =
    saveState.kind === "saving" ? "保存中…"
    : saveState.kind === "saved" ? `保存しました ${saveState.at}`
    : saveState.kind === "dirty" ? "未保存の変更"
    : saveState.kind === "untitled" ? "未保存"
    : "";

  return (
    <div className="min-h-screen bg-white">
      {/* 上部固定バー */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            href="/admin/blog"
            onClick={confirmLeave}
            className="shrink-0 text-sm text-slate-500 hover:text-slate-900"
          >
            ← 記事一覧
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span
              role="status"
              className={`truncate text-xs ${
                saveState.kind === "error" ? "text-red-600" : "text-slate-400"
              }`}
            >
              {uploading
                ? "画像をアップロード中…"
                : saveState.kind === "error"
                  ? saveState.message
                  : statusText}
            </span>
            {!isPublished && (
              <button
                type="button"
                disabled={uploading || saveState.kind === "saving"}
                onClick={saveDraftNow}
                className="shrink-0 text-sm font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-50"
              >
                下書き保存
              </button>
            )}
            <button
              type="button"
              disabled={uploading || isPublishing}
              onClick={openPublish}
              className="shrink-0 rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isPublished ? "更新を公開" : "公開する"}
            </button>
          </div>
        </div>
      </header>

      {/* 本文キャンバス（スマホは固定ツールバーに隠れないよう下に余白） */}
      <main className="mx-auto w-full max-w-2xl px-4 pb-28 md:pb-16">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            titleRef.current = e.target.value;
            markDirty();
          }}
          onKeyDown={(e) => {
            // note と同じく、タイトルで Enter すると本文へ移動
            if (e.key === "Enter") {
              e.preventDefault();
              // Tiptap v3のfocusコマンドは他要素からのDOMフォーカス移動を行わない
              // ことがあるため、view.dom.focus()を直接併用する
              editor?.commands.focus("start");
              requestAnimationFrame(() => editor?.view.dom.focus());
            }
          }}
          autoFocus={!initial}
          placeholder="記事タイトル"
          aria-label="記事タイトル"
          className="mt-8 w-full border-0 bg-transparent px-0 pb-2 text-3xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0 md:text-4xl"
        />
        <EditorContent editor={editor} />
        {editor && isDesktop && (
          <>
            <EditorBubbleMenu editor={editor} />
            <EditorFloatingMenu editor={editor} onPickImage={pickImage} />
          </>
        )}
      </main>

      {editor && <MobileToolbar editor={editor} onPickImage={pickImage} />}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <PublishSheet
        open={publishOpen}
        tagsText={tagsText}
        onTagsChange={(v) => {
          setTagsText(v);
          markDirty();
        }}
        publishing={isPublishing}
        error={publishError}
        onPublish={publish}
        onClose={() => setPublishOpen(false)}
      />
    </div>
  );
}
