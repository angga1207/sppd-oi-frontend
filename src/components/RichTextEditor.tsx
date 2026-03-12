'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import {
  FiBold,
  FiItalic,
  FiList,
} from 'react-icons/fi';
import { GoListOrdered } from 'react-icons/go';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** When 'numberedOnly', only the ordered list button is shown and active */
  toolbarMode?: 'full' | 'numberedOnly';
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Ketik di sini...',
  className = '',
  toolbarMode = 'full',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
        strike: false,
        // When numberedOnly, disable bold/italic/bulletList via keyboard shortcuts too
        bold: toolbarMode === 'numberedOnly' ? false : {},
        italic: toolbarMode === 'numberedOnly' ? false : {},
        bulletList: toolbarMode === 'numberedOnly' ? false : {},
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[80px] px-4 py-3 text-bubblegum-800',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g., when loading edit data)
  const syncContent = useCallback(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    syncContent();
  }, [syncContent]);

  if (!editor) {
    return (
      <div className={`rounded-2xl border-2 border-bubblegum-200 bg-white/50 min-h-[120px] animate-pulse ${className}`} />
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-xl transition-all duration-150 ${
        isActive
          ? 'bg-gradient-to-r from-bubblegum-500 to-grape-500 text-white shadow-md'
          : 'text-bubblegum-400 hover:text-bubblegum-600 hover:bg-bubblegum-50'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div
      className={`rounded-2xl border-2 border-bubblegum-200 bg-white/50 overflow-hidden transition-all focus-within:border-bubblegum-400 focus-within:shadow-[0_0_0_3px_rgba(168,85,247,0.15)] ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-bubblegum-100 bg-bubblegum-50/50">
        {toolbarMode === 'full' && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Tebal (Ctrl+B)"
            >
              <FiBold className="text-sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Miring (Ctrl+I)"
            >
              <FiItalic className="text-sm" />
            </ToolbarButton>

            <div className="w-px h-5 bg-bubblegum-200 mx-1" />
          </>
        )}

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Daftar Bernomor"
        >
          <GoListOrdered className="text-sm" />
        </ToolbarButton>

        {toolbarMode === 'full' && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Daftar Bulir"
          >
            <FiList className="text-sm" />
          </ToolbarButton>
        )}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
