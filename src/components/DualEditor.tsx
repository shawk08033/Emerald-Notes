'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { createLowlight } from 'lowlight';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import php from 'highlight.js/lib/languages/php';
import go from 'highlight.js/lib/languages/go';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import sqlLang from 'highlight.js/lib/languages/sql';
import csharp from 'highlight.js/lib/languages/csharp';
import 'highlight.js/styles/github-dark.css';

// configure lowlight (register a few common languages automatically)
const lowlight = createLowlight();
lowlight.register({ javascript: js, js });
lowlight.register({ typescript: ts, ts });
lowlight.register({ python });
lowlight.register({ java });
lowlight.register({ html: xml, xml });
lowlight.register({ css });
lowlight.register({ php });
lowlight.register({ go });
lowlight.register({ ruby });
lowlight.register({ rust });
lowlight.register({ sql: sqlLang });
lowlight.register({ csharp });

interface DualEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Safe node view for code block header
const CodeBlockWithToolbar = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'javascript',
        parseHTML: el => el.getAttribute('data-language') || 'javascript',
        renderHTML: attrs => ({ 'data-language': attrs.language }),
      },
    };
  },
  addNodeView() {
    return ({ node, editor }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'custom-code-block';

      const header = document.createElement('div');
      header.className = 'code-block-header';

      const select = document.createElement('select');
      select.className = 'codeblock-lang-select';
      CODE_LANGUAGES.forEach(l => {
        const o = document.createElement('option');
        o.value = l; o.text = l.toUpperCase();
        select.appendChild(o);
      });
      select.value = node.attrs.language || 'javascript';

      const pre = document.createElement('pre');
      const code = document.createElement('code');
      pre.setAttribute('data-language', select.value || 'javascript');
      const updatePreLanguage = (lang: string) => {
        try {
          pre.setAttribute('data-language', lang || 'javascript');
        } catch {}
      };
      pre.appendChild(code);

      select.onchange = () => {
        editor.chain().focus().updateAttributes('codeBlock', { language: select.value }).run();
        updatePreLanguage(select.value);
      };

      const copyBtn = document.createElement('button');
      copyBtn.className = 'codeblock-copy';
      copyBtn.textContent = 'Copy';

      // pre/code already created above

      copyBtn.onclick = () => {
        const text = code.textContent || '';
        navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
      };

      header.appendChild(select);
      header.appendChild(copyBtn);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      return {
        dom: wrapper,
        contentDOM: code,
        update(updated) {
          if (updated.type.name !== 'codeBlock') return false;
          if (updated.attrs.language && updated.attrs.language !== select.value) {
            select.value = updated.attrs.language;
            updatePreLanguage(updated.attrs.language);
          }
          return true;
        },
      };
    };
  },
});

// Common language options for highlighting
const CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'csharp',
  'ruby',
  'go',
  'rust',
  'html',
  'css',
  'sql',
  'php',
];

// Toolbar component for the visual editor
function Toolbar({ editor, onToolbarAction }: { editor: any; onToolbarAction: () => void }) {
  if (!editor) {
    return null;
  }

  const handleButtonClick = (action: () => void) => {
    onToolbarAction();
    action();
  };

  const currentCodeLang = editor.isActive('codeBlock')
    ? (editor.getAttributes('codeBlock')?.language || 'javascript')
    : '';

  return (
    <div className="border-b border-gray-200 p-3 bg-white flex flex-wrap gap-2 items-center">
      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleBold().run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('bold')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleItalic().run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold italic transition-colors ${
            editor.isActive('italic')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleStrike().run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold line-through transition-colors ${
            editor.isActive('strike')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Strikethrough"
        >
          S
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleCode().run())}
          className={`px-3 py-2 rounded-md text-sm font-mono transition-colors ${
            editor.isActive('code')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Inline Code"
        >
          {'</>'}
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Link (toggle) */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleButtonClick(() => {
            if (editor.isActive('link')) {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              return;
            }
            const prev = editor.getAttributes('link')?.href || '';
            const input = window.prompt('Enter URL', prev || 'https://');
            if (input === null) return;
            const value = input.trim();
            if (!value) return;
            let href = value;
            if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href)) {
              href = 'https://' + href;
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
          })}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('link')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Toggle Link"
        >
          Link
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
          className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
          className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
          className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Heading 3"
        >
          H3
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Lists and Blocks */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleBulletList().run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Bullet List"
        >
          •
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleOrderedList().run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Numbered List"
        >
          1.
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().toggleBlockquote().run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Quote"
        >
          "
        </button>
        <button
          onClick={() => handleButtonClick(() => {
            if (editor.isActive('codeBlock')) {
              editor.chain().focus().unsetCodeBlock().run();
            } else {
              editor.chain().focus().setCodeBlock({ language: 'javascript' }).run();
            }
          })}
          className={`px-3 py-2 rounded-md text-sm font-mono transition-colors ${
            editor.isActive('codeBlock')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Code Block"
        >
          {'{ }'}
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Tables */}
      <div className="flex items-center gap-1">
        <button
          onClick={() =>
            handleButtonClick(() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            )
          }
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Insert Table"
        >
          Table
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().addRowAfter().run())}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Add Row"
        >
          +Row
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().addColumnAfter().run())}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Add Column"
        >
          +Col
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().deleteTable().run())}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Delete Table"
        >
          Del Table
        </button>
      </div>

      {/* Language selector shown only inside a code block */}
      {/* per-code-block language select lives inside each code block toolbar */}
    </div>
  );
}

export default function DualEditor({ value, onChange, placeholder = "Start writing..." }: DualEditorProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isToolbarActionRef = useRef(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Add custom styles for code blocks
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-code-block {
        background: #1f2937;
        color: #f3f4f6;
        border-radius: 0.5rem;
        margin: 1rem 0;
        overflow: hidden;
      }
      
      .code-block-header {
        background: #374151;
        padding: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #4b5563;
      }
      
      .code-block-header select {
        background: #4b5563;
        color: #d1d5db;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        border: 1px solid #6b7280;
        outline: none;
        cursor: pointer;
      }
      
      .code-block-header button {
        background: #4b5563;
        color: #d1d5db;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        border: none;
        outline: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .code-block-header button:hover {
        background: #6b7280;
      }
      
      .custom-code-block pre {
        margin: 0;
        padding: 1rem;
        background: transparent;
        color: #f3f4f6;
        font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        overflow-x: auto;
      }
      
      .custom-code-block code {
        background: transparent;
        color: #f3f4f6;
      }

      /* Link styles inside editor */
      .tiptap a {
        color: #059669;
        text-decoration: underline;
      }
      .tiptap a:hover {
        color: #047857;
      }
      
      /* Syntax highlighting colors */
      .token.keyword { color: #f87171 !important; }
      .token.string { color: #a7f3d0 !important; }
      .token.number { color: #fbbf24 !important; }
      .token.function { color: #93c5fd !important; }
      .token.comment { color: #6b7280 !important; }
      .token.operator { color: #f3f4f6 !important; }
      .token.punctuation { color: #d1d5db !important; }
      .token.class-name { color: #a78bfa !important; }
      .token.variable { color: #f3f4f6 !important; }

      /* Table styles */
      .tiptap table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
      }
      .tiptap th, .tiptap td {
        border: 1px solid #e5e7eb;
        padding: 0.5rem 0.75rem;
        text-align: left;
      }
      .tiptap thead th {
        background: #f9fafb;
        font-weight: 600;
      }
      .tiptap tbody tr:nth-child(odd) {
        background: #fafafa;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Proper debounce function
  const debouncedOnChange = useCallback((newValue: string) => {
    if (isToolbarActionRef.current) {
      // Skip debouncing for toolbar actions
      onChange(newValue);
      isToolbarActionRef.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 1000); // 1 second delay
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        protocols: ['http', 'https', 'mailto', 'tel'],
      }),
      CodeBlockWithToolbar.configure({ lowlight }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== value) {
        debouncedOnChange(html);
      }
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Allow opening links only with Ctrl/Cmd-click in edit mode
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = (target.closest && target.closest('a')) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        try {
          window.open(href, '_blank', 'noopener');
        } catch {
          // ignore
        }
      } else {
        // Prevent accidental navigation on plain click while editing
        e.preventDefault();
      }
    };
    dom.addEventListener('click', handleClick);
    return () => {
      dom.removeEventListener('click', handleClick);
    };
  }, [editor]);

  // Removed Markdown mode: component now operates in Visual (HTML) mode only

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Remove previous per-block toolbar injector to avoid ProseMirror loops
    return () => {};
  }, [editor]);

  return (
    <div className="h-full flex flex-col">
      {/* Editor Content */}
      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
        <div className="h-full flex flex-col">
          <Toolbar
            editor={editor}
            onToolbarAction={() => {
              isToolbarActionRef.current = true;
              setForceUpdate(prev => prev + 1); // Force re-render
            }}
          />
          <div className="flex-1 p-4 overflow-y-auto min-h-0">
            <EditorContent
              editor={editor}
              className="tiptap h-full"
              key={forceUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
