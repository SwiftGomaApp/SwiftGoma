"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "link"],
  ["clean"],
];

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function isRichTextEmpty(value: string) {
  const stripped = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return stripped.length === 0;
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Rédigez votre article…",
  className,
}: RichTextEditorProps) {
  return (
    <div
      id={id}
      className={cn(
        "rich-text-editor overflow-hidden rounded-md border bg-background",
        className,
      )}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{ toolbar: TOOLBAR }}
      />
    </div>
  );
}
