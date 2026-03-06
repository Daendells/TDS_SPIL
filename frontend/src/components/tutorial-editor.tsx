"use client";

import { useRef, useEffect, type FC, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Extension } from "@tiptap/core";
import { cn } from "@/lib/utils";
import api, { BASE_URL } from "@/app/lib/api";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Image as ImageIcon,
} from "lucide-react";

/* ── Tab handler: indent list items or insert spaces ── */
const TabHandler = Extension.create({
  name: "tabHandler",
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive("listItem")) {
          this.editor.commands.sinkListItem("listItem");
          return true;
        }
        this.editor.commands.insertContent("\u00A0\u00A0\u00A0\u00A0");
        return true;
      },
      "Shift-Tab": () => {
        if (this.editor.isActive("listItem")) {
          this.editor.commands.liftListItem("listItem");
          return true;
        }
        return true;
      },
    };
  },
});

interface TutorialEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const MenuButton: FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "inline-flex items-center justify-center rounded p-1.5 transition-colors",
      "hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed",
      active ? "bg-slate-200 text-gray-900" : "text-slate-600"
    )}
  >
    {children}
  </button>
);

function Separator() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 self-center" />;
}

export function TutorialEditor({ content, onChange }: TutorialEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Placeholder.configure({
        placeholder: "Tulis penjelasan atau tutorial assessment di sini...",
      }),
      Image.configure({ inline: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TabHandler,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-content focus:outline-none min-h-[300px] px-4 py-3",
      },
      handleDOMEvents: {
        keydown: (_view, event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
    },
  });

  /* Sync when external `content` prop changes */
  useEffect(() => {
    if (!editor) return;
    if (content != null && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post<{ data: { imageUrl: string } }>(
        "/api/assessments/upload-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      // Prepend backend base URL so the <img> src resolves correctly
      const src = `${BASE_URL}${res.data.data.imageUrl}`;
      editor.chain().focus().setImage({ src }).run();
    } catch {
      alert("Gagal mengupload gambar");
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-slate-50 shrink-0">
        {/* Bold / Italic / Underline */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>

        <Separator />

        {/* Headings */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <span className="text-xs font-bold">H1</span>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <span className="text-xs font-bold">H2</span>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <span className="text-xs font-bold">H3</span>
        </MenuButton>

        <Separator />

        {/* Lists */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>

        <Separator />

        {/* Text alignment */}
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </MenuButton>

        <Separator />

        {/* Table */}
        <MenuButton
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          active={editor.isActive("table")}
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().chain().focus().addRowAfter().run()}
          title="Add Row"
        >
          <span className="text-xs font-semibold">+Row</span>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().chain().focus().addColumnAfter().run()}
          title="Add Column"
        >
          <span className="text-xs font-semibold">+Col</span>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.isActive("table")}
          title="Delete Table"
        >
          <span className="text-xs font-semibold text-red-600">DelTbl</span>
        </MenuButton>

        <Separator />

        {/* Image */}
        <MenuButton onClick={handleImageClick} title="Upload Image">
          <ImageIcon className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className={[
          "flex-1 overflow-y-auto bg-white",
          "[&_table]:w-full [&_table]:border-collapse [&_table]:my-2",
          "[&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_td]:align-top",
          "[&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-50 [&_th]:font-semibold [&_th]:text-left",
        ].join(" ")}
      />

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
    </div>
  );
}
