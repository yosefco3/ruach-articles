import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import { Color } from "@tiptap/extension-color";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { HtmlEmbed } from "./editor/htmlEmbed";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Link2,
  Image as ImageIcon,
  Redo2,
  Undo2,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Quote,
  Minus,
  Table as TableIcon,
  Eraser,
  Highlighter,
  Type,
  ChevronDown,
  FileCode2,
} from "lucide-react";
import "./RichTextEditor.css";

const lowlight = createLowlight();
lowlight.register("javascript", javascript);
lowlight.register("typescript", typescript);
lowlight.register("html", html);
lowlight.register("css", css);

// ── Color palettes ──────────────────────────────────────────────
const TEXT_COLORS = [
  "#000000", "#374151", "#6b7280", "#d1d5db", "#ffffff",
  "#ef4444", "#b91c1c", "#f97316", "#d97706", "#eab308",
  "#22c55e", "#15803d", "#14b8a6", "#3b82f6", "#1d4ed8",
  "#a855f7", "#7c3aed", "#ec4899", "#92400e", "#78350f",
];

const TEXT_COLOR_LABELS: Record<string, string> = {
  "#000000": "שחור", "#374151": "אפור כהה", "#6b7280": "אפור",
  "#d1d5db": "אפור בהיר", "#ffffff": "לבן",
  "#ef4444": "אדום", "#b91c1c": "אדום כהה", "#f97316": "כתום",
  "#d97706": "זהב", "#eab308": "צהוב",
  "#22c55e": "ירוק", "#15803d": "ירוק כהה", "#14b8a6": "טורקיז",
  "#3b82f6": "כחול", "#1d4ed8": "כחול כהה",
  "#a855f7": "סגול", "#7c3aed": "סגול כהה", "#ec4899": "ורוד",
  "#92400e": "חום", "#78350f": "חום כהה",
};

const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8",
  "#fed7aa", "#e9d5ff", "#fecaca", "#e5e7eb",
];

const HIGHLIGHT_LABELS: Record<string, string> = {
  "#fef08a": "צהוב", "#bbf7d0": "ירוק", "#bfdbfe": "כחול",
  "#fbcfe8": "ורוד", "#fed7aa": "כתום", "#e9d5ff": "סגול",
  "#fecaca": "אדום", "#e5e7eb": "אפור",
};

// ── Font sizes ───────────────────────────────────────────────────
const FONT_SIZES = [
  { label: "קטן מאוד (12)", value: "12px" },
  { label: "קטן (14)", value: "14px" },
  { label: "רגיל (16)", value: "16px" },
  { label: "בינוני (18)", value: "18px" },
  { label: "גדול (20)", value: "20px" },
  { label: "גדול מאוד (24)", value: "24px" },
  { label: "ענק (30)", value: "30px" },
  { label: "ענק מאוד (36)", value: "36px" },
  { label: "ממדי (48)", value: "48px" },
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * Register the raw-HTML embed block (admin article form only).
   * Off by default — editors without it strip embed markup on paste,
   * so e.g. guest posts can never carry raw HTML.
   */
  enableHtmlEmbed?: boolean;
}

// ── Small helpers ────────────────────────────────────────────────
function Sep() {
  return <div className="w-px bg-border mx-0.5 self-stretch my-0.5" />;
}

function ToolBtn({
  onClick,
  active,
  title,
  children,
  className = "",
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center h-7 w-7 rounded text-sm transition-colors
        hover:bg-accent hover:text-accent-foreground
        ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground"}
        ${className}`}
    >
      {children}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "כתבו את תוכן המאמר כאן...",
  enableHtmlEmbed = false,
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showHtmlEmbed, setShowHtmlEmbed] = useState(false);
  const [htmlEmbedDraft, setHtmlEmbedDraft] = useState("");
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  // Guard: don't propagate onChange until the editor has been seeded with real
  // content. This prevents an empty-string write when the editor mounts before
  // the async `value` prop arrives from the server.
  const readyRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: { openOnClick: false } }),
      CodeBlockLowlight.configure({ lowlight }),
      Image,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Superscript,
      Subscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      ...(enableHtmlEmbed ? [HtmlEmbed] : []),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (!readyRef.current) return;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none",
        dir: "rtl",
        "data-placeholder": placeholder,
      },
    },
  });

  // Sync the editor with the `value` prop. This runs both when content
  // arrives asynchronously (edit mode) AND when the parent swaps `value`
  // for a different record (e.g. switching trigram/hexagram in the admin):
  // the same editor instance is reused, so we must reset its content to
  // match the incoming value instead of leaving the previous record's text.
  useEffect(() => {
    if (!editor) return;
    const norm = (s: string) => (s === "" || s === "<p></p>" ? "" : s);
    const incoming = value ?? "";
    const current = editor.getHTML();
    // Replace content when it actually differs — but never while the user is
    // typing in this editor (that diff is the user's own edit round-tripping
    // back through onChange, and re-setting it would fight the cursor).
    if (norm(incoming) !== norm(current) && !editor.isFocused) {
      editor.commands.setContent(incoming, false as any);
    }
    // value has been reconciled — onUpdate may now propagate user edits.
    readyRef.current = true;
  }, [editor, value]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColorPicker(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) setShowHighlightPicker(false);
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) setShowFontSize(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!editor) return null;

  const addLink = () => {
    const url = prompt("הזינו את כתובת הקישור:");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = prompt("הזינו את כתובת התמונה:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const openHtmlEmbed = () => {
    setHtmlEmbedDraft(
      editor.isActive("htmlEmbed") ? editor.getAttributes("htmlEmbed").html ?? "" : "",
    );
    setShowHtmlEmbed(true);
  };

  const saveHtmlEmbed = () => {
    const html = htmlEmbedDraft.trim();
    if (html) {
      if (editor.isActive("htmlEmbed")) {
        editor.chain().focus().updateHtmlEmbed(html).run();
      } else {
        editor.chain().focus().insertHtmlEmbed(html).run();
      }
    }
    setShowHtmlEmbed(false);
  };

  const currentColor = editor.getAttributes("textStyle").color || "";
  const currentHighlight = editor.getAttributes("highlight").color || "";
  const currentFontSize = editor.getAttributes("textStyle").fontSize || "";

  const closeAll = () => {
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    setShowFontSize(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* ══════════════════════════════════════════
          TOOLBAR
      ══════════════════════════════════════════ */}
      <div className="border-b border-border bg-card px-2 py-1.5 flex flex-wrap gap-0.5 items-center">

        {/* History */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="בטל (Ctrl+Z)">
          <Undo2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="חזור (Ctrl+Y)">
          <Redo2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="נקה עיצוב"
        >
          <Eraser className="w-3.5 h-3.5" />
        </ToolBtn>

        <Sep />

        {/* Font Size */}
        <div className="relative" ref={fontSizeRef}>
          <button
            type="button"
            onClick={() => { setShowFontSize(!showFontSize); setShowColorPicker(false); setShowHighlightPicker(false); }}
            className="flex items-center gap-0.5 h-7 px-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="גודל גופן"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{currentFontSize || "גודל"}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showFontSize && (
            <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[160px] py-1">
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetFontSize().run(); setShowFontSize(false); }}
                className="w-full text-right px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                ברירת מחדל
              </button>
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  type="button"
                  onClick={() => { editor.chain().focus().setFontSize(fs.value).run(); setShowFontSize(false); }}
                  className={`w-full text-right px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors ${currentFontSize === fs.value ? "bg-accent text-accent-foreground" : ""}`}
                  style={{ fontSize: fs.value }}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Sep />

        {/* Headings */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="כותרת ראשית (H1)"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="כותרת משנית (H2)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="כותרת קטנה (H3)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </ToolBtn>

        <Sep />

        {/* Basic formatting */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="מודגש (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="נטוי (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="קו תחתון (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="קו חוצה"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive("superscript")}
          title="כתב עילי"
        >
          <SuperscriptIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive("subscript")}
          title="כתב תחתי"
        >
          <SubscriptIcon className="w-3.5 h-3.5" />
        </ToolBtn>

        <Sep />

        {/* Text Color */}
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); setShowFontSize(false); }}
            className="flex flex-col items-center justify-center h-7 w-7 rounded hover:bg-accent transition-colors"
            title="צבע טקסט"
          >
            <span
              className="text-xs font-bold leading-none"
              style={{ color: currentColor || "currentColor" }}
            >A</span>
            <span
              className="w-4 h-1 rounded-sm mt-0.5"
              style={{ backgroundColor: currentColor || "hsl(var(--foreground))" }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-xl z-50 p-3 w-52">
              <p className="text-xs font-medium text-muted-foreground mb-2">צבע טקסט</p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { editor.chain().focus().setColor(c).run(); closeAll(); }}
                    className={`w-7 h-7 rounded border-2 hover:scale-110 transition-transform ${currentColor === c ? "border-primary" : "border-transparent"}`}
                    style={{ backgroundColor: c, outline: c === "#ffffff" ? "1px solid #e5e7eb" : undefined }}
                    title={TEXT_COLOR_LABELS[c] || c}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetColor().run(); closeAll(); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 border border-border rounded hover:bg-accent transition-colors mb-2"
              >
                ברירת מחדל
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-8 h-8 rounded cursor-pointer border border-border p-0.5 bg-transparent"
                  value={currentColor || "#000000"}
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                  title="צבע מותאם אישית"
                />
                <span className="text-xs text-muted-foreground">צבע מותאם</span>
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color */}
        <div className="relative" ref={highlightRef}>
          <button
            type="button"
            onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); setShowFontSize(false); }}
            className="flex flex-col items-center justify-center h-7 w-7 rounded hover:bg-accent transition-colors"
            title="צבע רקע / הדגשה"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span
              className="w-4 h-1 rounded-sm mt-0.5"
              style={{
                backgroundColor: currentHighlight || "transparent",
                border: currentHighlight ? "none" : "1px solid hsl(var(--border))",
              }}
            />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-xl z-50 p-3 w-44">
              <p className="text-xs font-medium text-muted-foreground mb-2">צבע רקע</p>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); closeAll(); }}
                    className={`w-7 h-7 rounded border-2 hover:scale-110 transition-transform ${currentHighlight === c ? "border-primary" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    title={HIGHLIGHT_LABELS[c] || c}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); closeAll(); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 border border-border rounded hover:bg-accent transition-colors mb-2"
              >
                הסר הדגשה
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-8 h-8 rounded cursor-pointer border border-border p-0.5 bg-transparent"
                  value={currentHighlight || "#fef08a"}
                  onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                  title="צבע מותאם"
                />
                <span className="text-xs text-muted-foreground">מותאם</span>
              </div>
            </div>
          )}
        </div>

        <Sep />

        {/* Text Alignment */}
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="יישור לימין"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="מרכוז"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="יישור לשמאל"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="יישור מלא"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </ToolBtn>

        <Sep />

        {/* Writing Direction */}
        <button
          type="button"
          onClick={() => {
            const { from } = editor.state.selection;
            const resolvedPos = editor.state.doc.resolve(from);
            const parentNode = resolvedPos.node();
            const currentDir = (parentNode?.attrs as any)?.dir || "rtl";
            const newDir = currentDir === "rtl" ? "ltr" : "rtl";
            const nodeType = parentNode?.type?.name;
            if (nodeType === "heading") {
              editor.chain().focus().updateAttributes("heading", { dir: newDir }).run();
            } else {
              editor.chain().focus().updateAttributes("paragraph", { dir: newDir }).run();
            }
          }}
          className="flex items-center gap-1 h-7 px-2 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors font-mono"
          title="שנה כיוון כתיבה (RTL ↔ LTR)"
        >
          RTL⇄LTR
        </button>

        <Sep />

        {/* Lists */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="רשימה לא ממוספרת"
        >
          <List className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="רשימה ממוספרת"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolBtn>

        <Sep />

        {/* Block elements */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="ציטוט"
        >
          <Quote className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="קו מפריד"
        >
          <Minus className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="בלוק קוד"
        >
          <Code className="w-3.5 h-3.5" />
        </ToolBtn>

        <Sep />

        {/* Table */}
        <ToolBtn onClick={insertTable} title="הוסף טבלה (3×3)">
          <TableIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        {editor.isActive("table") && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="h-7 px-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="הוסף עמודה"
            >+עמ׳</button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="h-7 px-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="הוסף שורה"
            >+שורה</button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="h-7 px-1.5 rounded text-xs text-destructive hover:bg-accent transition-colors"
              title="מחק עמודה"
            >−עמ׳</button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="h-7 px-1.5 rounded text-xs text-destructive hover:bg-accent transition-colors"
              title="מחק שורה"
            >−שורה</button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="h-7 px-1.5 rounded text-xs text-destructive hover:bg-accent transition-colors"
              title="מחק טבלה"
            >מחק טבלה</button>
          </>
        )}

        <Sep />

        {/* Media */}
        <ToolBtn
          onClick={addLink}
          active={editor.isActive("link")}
          title="הוסף קישור"
        >
          <Link2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={addImage} title="הוסף תמונה מ-URL">
          <ImageIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        {enableHtmlEmbed && (
          <>
            <Sep />
            <ToolBtn
              onClick={openHtmlEmbed}
              active={editor.isActive("htmlEmbed")}
              title={editor.isActive("htmlEmbed") ? "ערוך בלוק HTML" : "הטמעת HTML (תרשימים)"}
            >
              <FileCode2 className="w-3.5 h-3.5" />
            </ToolBtn>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════
          EDITOR CONTENT
      ══════════════════════════════════════════ */}
      <EditorContent
        editor={editor}
        className="prose prose-invert max-w-none p-4"
        style={{ minHeight: "400px", direction: "rtl" }}
      />

      {/* ══════════════════════════════════════════
          HTML EMBED DIALOG
      ══════════════════════════════════════════ */}
      {enableHtmlEmbed && (
        <Dialog open={showHtmlEmbed} onOpenChange={setShowHtmlEmbed}>
          <DialogContent className="sm:max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>הטמעת HTML</DialogTitle>
              <DialogDescription>
                הדביקו קטע HTML עצמאי (למשל תרשים השוואה) — הוא יישמר ויוצג במאמר
                כפי שהוא, כולל העיצוב הפנימי שלו.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={htmlEmbedDraft}
              onChange={(e) => setHtmlEmbedDraft(e.target.value)}
              dir="ltr"
              rows={12}
              className="font-mono text-xs"
              placeholder="<style>…</style>&#10;<div>…</div>"
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowHtmlEmbed(false)}>
                ביטול
              </Button>
              <Button type="button" onClick={saveHtmlEmbed} disabled={!htmlEmbedDraft.trim()}>
                {editor.isActive("htmlEmbed") ? "עדכון הבלוק" : "הוספה למאמר"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
