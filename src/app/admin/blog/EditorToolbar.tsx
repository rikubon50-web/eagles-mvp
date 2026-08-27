"use client";
// note風エディタの浮遊メニュー（PC）とキーボード上固定ツールバー（スマホ）。
// 保存や画像アップロードのロジックは持たず、PostEditor からコールバックで受け取る。
import { useEffect, useState } from "react";
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

type ToolbarProps = {
  editor: Editor;
  onSetLink: () => void;
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

/* ===== PC: 選択範囲上のダークな浮遊バー ===== */

const bubbleBtn = (active: boolean) =>
  `flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
    active ? "bg-slate-700 text-emerald-300" : "text-white hover:bg-slate-700"
  }`;

export function EditorBubbleMenu({ editor, onSetLink }: Omit<ToolbarProps, "onPickImage">) {
  const state = useFormatState(editor);
  const [panel, setPanel] = useState<"color" | "size" | null>(null);

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: e, state: s }) =>
        e.isEditable && !s.selection.empty && !e.isActive("image")
      }
    >
      {/* mousedown を止めて選択範囲とフォーカスを保つ */}
      <div
        className="relative flex items-center gap-0.5 rounded-lg bg-slate-900 p-1 text-white shadow-lg"
        onMouseDown={(e) => e.preventDefault()}
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
        <button type="button" aria-label="リンク" className={bubbleBtn(state.link)}
          onClick={() => { setPanel(null); onSetLink(); }}>
          <LinkIcon size={16} />
        </button>
        <button type="button" aria-label="箇条書き" className={bubbleBtn(state.bullet)}
          onClick={() => { setPanel(null); editor.chain().focus().toggleBulletList().run(); }}>
          <List size={16} />
        </button>

        {panel === "color" && (
          <div className="absolute left-0 top-full mt-2 flex items-center gap-1.5 rounded-lg bg-slate-900 p-2 shadow-lg">
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
          <div className="absolute left-0 top-full mt-2 flex items-center gap-1 rounded-lg bg-slate-900 p-1.5 shadow-lg">
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
      </div>
    </BubbleMenu>
  );
}

/* ===== PC: 空行左の「＋」メニュー ===== */

export function EditorFloatingMenu({ editor, onPickImage }: Omit<ToolbarProps, "onSetLink">) {
  const [open, setOpen] = useState(false);

  return (
    <FloatingMenu editor={editor} options={{ placement: "left", offset: 12 }}>
      <div className="relative" onMouseDown={(e) => e.preventDefault()}>
        <button type="button" aria-label="ブロックを追加"
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-sm transition-transform hover:bg-slate-50 ${
            open ? "rotate-45" : ""
          }`}
          onClick={() => setOpen((v) => !v)}>
          <Plus size={18} />
        </button>
        {open && (
          <div className="absolute left-10 top-0 z-10 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
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

export function MobileToolbar({ editor, onSetLink, onPickImage }: ToolbarProps) {
  const state = useFormatState(editor);
  const [colorOpen, setColorOpen] = useState(false);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
      onMouseDown={(e) => e.preventDefault()}
    >
      {colorOpen && (
        <div className="flex items-center justify-around border-b border-slate-100 px-3 py-2">
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={`文字色 ${c}`}
              className={`h-9 w-9 rounded-full border-2 ${
                state.color === c ? "border-slate-400" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              onClick={() => { editor.chain().focus().setColor(c).run(); setColorOpen(false); }} />
          ))}
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
          onClick={() => setColorOpen((v) => !v)}>
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
        <button type="button" aria-label="リンク" className={mobileBtn(state.link)}
          onClick={onSetLink}>
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
