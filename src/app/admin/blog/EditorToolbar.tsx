"use client";
// note風エディタの浮遊メニュー（PC）とキーボード上固定ツールバー（スマホ）。
// 保存や画像アップロードのロジックは持たず、PostEditor からコールバックで受け取る。
import { useEffect, useRef, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import {
  Bold,
  Heading2,
  ImagePlus,
  Link as LinkIcon,
  List,
  Palette,
  Plus,
  TextAlignCenter,
  Type,
} from "lucide-react";

export const COLORS = [
  "#0f172a", "#dc2626", "#ea580c", "#ca8a04",
  "#16a34a", "#0f6536", "#2563eb", "#7c3aed",
];

export const FONT_SIZES: { label: string; value: string | null }[] = [
  { label: "小", value: "0.85em" },
  { label: "標準", value: null },
  { label: "大", value: "1.4em" },
];

// md(768px) 以上かどうか。SSR では false（BubbleMenu 等はクライアント限定）。
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

// iOS Safari 等でソフトキーボード表示中も固定ツールバーをキーボードの上に保つ。
// fixed bottom-0 はレイアウトビューポート基準なので、visualViewport との差分だけ持ち上げる。
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return inset;
}

type ToolbarProps = {
  editor: Editor;
  onPickImage: () => void;
};

function useFormatState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      heading: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      center: e.isActive({ textAlign: "center" }),
      link: e.isActive("link"),
      color: ((e.getAttributes("textStyle").color as string | undefined) ?? null),
      small: e.isActive("textStyle", { fontSize: "0.85em" }),
      large: e.isActive("textStyle", { fontSize: "1.4em" }),
    }),
  });
}

// ツールバー内の mousedown で編集中の選択とフォーカスを保つ（入力欄だけは許可）
function keepEditorFocus(e: React.MouseEvent) {
  if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
}

/* ===== リンク入力（BubbleMenu / スマホツールバー共用のインラインフォーム） ===== */

const isValidHref = (v: string) => /^https?:\/\/\S+$/i.test(v);

function LinkForm({
  editor,
  dark = false,
  onDone,
}: {
  editor: Editor;
  dark?: boolean;
  onDone: () => void;
}) {
  const [value, setValue] = useState(
    () => ((editor.getAttributes("link").href as string | undefined) ?? "")
  );
  const trimmed = value.trim();
  const valid = isValidHref(trimmed);
  const hasLink = editor.isActive("link");
  // 空欄=リンク解除（既存リンクがある時のみ）、入力あり=有効な http(s) URL のみ適用可
  const canApply = trimmed ? valid : hasLink;

  // Tiptap v3のfocusコマンドはリンク入力欄からのDOMフォーカス復帰を行わない
  // ことがあるため、view.dom.focus()を直接併用する
  const refocus = () => requestAnimationFrame(() => editor.view.dom.focus());

  const apply = () => {
    if (!trimmed) {
      if (!hasLink) return;
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      refocus();
      onDone();
      return;
    }
    if (!valid) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    refocus();
    onDone();
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    refocus();
    onDone();
  };

  return (
    <div className="flex w-full items-center gap-1.5">
      <input
        autoFocus
        type="url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onDone();
          }
        }}
        placeholder="https://example.com"
        aria-label="リンク先URL"
        aria-invalid={Boolean(trimmed) && !valid}
        className={
          dark
            ? "w-56 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
            : "min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
        }
      />
      <button
        type="button"
        disabled={!canApply}
        onClick={apply}
        className={
          dark
            ? "shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 disabled:opacity-40"
            : "shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        }
      >
        適用
      </button>
      {hasLink && (
        <button
          type="button"
          onClick={remove}
          className={
            dark
              ? "shrink-0 px-1.5 py-1.5 text-xs text-slate-300 hover:text-white"
              : "shrink-0 px-1.5 py-2 text-sm text-slate-500 hover:text-slate-800"
          }
        >
          解除
        </button>
      )}
    </div>
  );
}

/* ===== PC: 選択範囲上のダークな浮遊バー ===== */

const bubbleBtn = (active: boolean) =>
  `flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
    active ? "bg-slate-700 text-emerald-300" : "text-white hover:bg-slate-700"
  }`;

export function EditorBubbleMenu({ editor }: { editor: Editor }) {
  const state = useFormatState(editor);
  const [panel, setPanel] = useState<"color" | "size" | "link" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // メニューが隠れる契機（選択変更・エディタ外への blur）でサブパネルの残留を防ぐ。
  // リンク入力欄へのフォーカス移動（relatedTarget がメニュー内）では閉じない。
  useEffect(() => {
    const closeOnSelection = () => setPanel(null);
    const closeOnBlur = ({ event }: { event: FocusEvent }) => {
      const related = event?.relatedTarget;
      if (related instanceof Node && containerRef.current?.contains(related)) return;
      setPanel(null);
    };
    editor.on("selectionUpdate", closeOnSelection);
    editor.on("blur", closeOnBlur);
    return () => {
      editor.off("selectionUpdate", closeOnSelection);
      editor.off("blur", closeOnBlur);
    };
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: e, state: s }) =>
        e.isEditable && !s.selection.empty && !e.isActive("image")
      }
    >
      {/* mousedown を止めて選択範囲とフォーカスを保つ。z-50 で sticky ヘッダー(z-40)より前面に */}
      <div
        ref={containerRef}
        className="relative z-50 flex items-center gap-0.5 rounded-lg bg-slate-900 p-1 text-white shadow-lg"
        onMouseDown={keepEditorFocus}
      >
        <button type="button" aria-label="太字" className={bubbleBtn(state.bold)}
          onClick={() => { setPanel(null); editor.chain().focus().toggleBold().run(); }}>
          <Bold size={16} />
        </button>
        <button type="button" aria-label="見出し" className={bubbleBtn(state.heading)}
          onClick={() => { setPanel(null); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}>
          <Heading2 size={16} />
        </button>
        <button type="button" aria-label="文字色" className={bubbleBtn(panel === "color")}
          onClick={() => setPanel(panel === "color" ? null : "color")}>
          <Palette size={16} />
        </button>
        <button type="button" aria-label="文字サイズ" className={bubbleBtn(panel === "size")}
          onClick={() => setPanel(panel === "size" ? null : "size")}>
          <Type size={16} />
        </button>
        <button type="button" aria-label="中央寄せ" className={bubbleBtn(state.center)}
          onClick={() => { setPanel(null); editor.chain().focus().toggleTextAlign("center").run(); }}>
          <TextAlignCenter size={16} />
        </button>
        <button type="button" aria-label="リンク" className={bubbleBtn(state.link || panel === "link")}
          onClick={() => setPanel(panel === "link" ? null : "link")}>
          <LinkIcon size={16} />
        </button>
        <button type="button" aria-label="箇条書き" className={bubbleBtn(state.bullet)}
          onClick={() => { setPanel(null); editor.chain().focus().toggleBulletList().run(); }}>
          <List size={16} />
        </button>

        {/* サブパネルは選択テキストを覆わないよう上向きに開く */}
        {panel === "color" && (
          <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 rounded-lg bg-slate-900 p-2 shadow-lg">
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={`文字色 ${c}`}
                className={`h-6 w-6 rounded-full border-2 ${
                  state.color === c ? "border-white" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => { editor.chain().focus().setColor(c).run(); setPanel(null); }} />
            ))}
          </div>
        )}

        {panel === "size" && (
          <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 rounded-lg bg-slate-900 p-1.5 shadow-lg">
            {FONT_SIZES.map(({ label, value }) => {
              const active = value === "0.85em" ? state.small
                : value === "1.4em" ? state.large
                : !state.small && !state.large;
              return (
                <button key={label} type="button"
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                    active ? "bg-slate-700 text-emerald-300" : "text-white hover:bg-slate-700"
                  }`}
                  onClick={() => {
                    if (value) editor.chain().focus().setFontSize(value).run();
                    else editor.chain().focus().unsetFontSize().run();
                    setPanel(null);
                  }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {panel === "link" && (
          <div className="absolute bottom-full left-0 mb-2 rounded-lg bg-slate-900 p-2 shadow-lg">
            <LinkForm editor={editor} dark onDone={() => setPanel(null)} />
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}

/* ===== PC: 空行左の「＋」メニュー ===== */

export function EditorFloatingMenu({ editor, onPickImage }: ToolbarProps) {
  const [open, setOpen] = useState(false);

  // 別の行へ移動・エディタ外クリックで「開いたまま」状態が残らないようにする
  useEffect(() => {
    const close = () => setOpen(false);
    editor.on("selectionUpdate", close);
    editor.on("blur", close);
    return () => {
      editor.off("selectionUpdate", close);
      editor.off("blur", close);
    };
  }, [editor]);

  return (
    <FloatingMenu editor={editor} options={{ placement: "left", offset: 12 }}>
      <div className="relative z-50" onMouseDown={keepEditorFocus}>
        <button type="button" aria-label="ブロックを追加"
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-sm transition-transform hover:bg-slate-50 ${
            open ? "rotate-45" : ""
          }`}
          onClick={() => setOpen((v) => !v)}>
          <Plus size={18} />
        </button>
        {/* note と同じく、書こうとしている行を覆わないよう下に開く */}
        {open && (
          <div className="absolute left-0 top-10 z-10 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => { setOpen(false); onPickImage(); }}>
              <ImagePlus size={16} className="text-slate-500" />
              画像を追加
            </button>
          </div>
        )}
      </div>
    </FloatingMenu>
  );
}

/* ===== スマホ: キーボード上の固定ツールバー ===== */

const mobileBtn = (active: boolean) =>
  `flex h-11 w-11 items-center justify-center rounded-lg ${
    active ? "bg-slate-100 text-emerald-700" : "text-slate-600"
  }`;

export function MobileToolbar({ editor, onPickImage }: ToolbarProps) {
  const state = useFormatState(editor);
  const [colorOpen, setColorOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const keyboardInset = useKeyboardInset();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
      style={
        keyboardInset > 0
          ? { transform: `translateY(-${keyboardInset}px)`, paddingBottom: 0 }
          : undefined
      }
      onMouseDown={keepEditorFocus}
    >
      {colorOpen && (
        <div className="flex items-center justify-around border-b border-slate-100 px-2 py-1.5">
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={`文字色 ${c}`}
              className={`h-11 w-11 rounded-full border-2 p-1.5 ${
                state.color === c ? "border-slate-400" : "border-transparent"
              }`}
              onClick={() => { editor.chain().focus().setColor(c).run(); setColorOpen(false); }}>
              <span className="block h-full w-full rounded-full" style={{ backgroundColor: c }} />
            </button>
          ))}
        </div>
      )}
      {linkOpen && (
        <div className="border-b border-slate-100 px-3 py-2">
          <LinkForm editor={editor} onDone={() => setLinkOpen(false)} />
        </div>
      )}
      <div className="flex items-center justify-around px-1 py-1">
        <button type="button" aria-label="太字" className={mobileBtn(state.bold)}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={20} />
        </button>
        <button type="button" aria-label="見出し" className={mobileBtn(state.heading)}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={20} />
        </button>
        <button type="button" aria-label="文字色" className={mobileBtn(colorOpen)}
          onClick={() => { setLinkOpen(false); setColorOpen((v) => !v); }}>
          <Palette size={20} />
        </button>
        <button type="button" aria-label="中央寄せ" className={mobileBtn(state.center)}
          onClick={() => editor.chain().focus().toggleTextAlign("center").run()}>
          <TextAlignCenter size={20} />
        </button>
        <button type="button" aria-label="箇条書き" className={mobileBtn(state.bullet)}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={20} />
        </button>
        <button type="button" aria-label="リンク" className={mobileBtn(state.link || linkOpen)}
          onClick={() => { setColorOpen(false); setLinkOpen((v) => !v); }}>
          <LinkIcon size={20} />
        </button>
        <button type="button" aria-label="画像を追加" className={mobileBtn(false)}
          onClick={onPickImage}>
          <ImagePlus size={20} />
        </button>
      </div>
    </div>
  );
}
