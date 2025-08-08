'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';

// configure lowlight (register a few common languages automatically)
const lowlight = createLowlight();
lowlight.register({ javascript: js, js });
lowlight.register({ typescript: ts, ts });
lowlight.register({ python });
lowlight.register({ java });

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
      select.onchange = () => {
        editor.chain().focus().updateAttributes('codeBlock', { language: select.value }).run();
      };

      const copyBtn = document.createElement('button');
      copyBtn.className = 'codeblock-copy';
      copyBtn.textContent = 'Copy';

      const pre = document.createElement('pre');
      const code = document.createElement('code');
      pre.appendChild(code);

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
];

// Toolbar component for the visual editor
function Toolbar({ editor, onToolbarAction }: { editor: any; onToolbarAction: () => void }) {
  if (!editor) {
    return null;
  }

  const handleButtonClick = (action: () => void) => {
    onToolbarAction();
    editor.chain().focus().run();
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

      {/* Language selector shown only inside a code block */}
      {/* per-code-block language select lives inside each code block toolbar */}
    </div>
  );
}

export default function DualEditor({ value, onChange, placeholder = "Start writing..." }: DualEditorProps) {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
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
      CodeBlockWithToolbar.configure({ lowlight }),
      Placeholder.configure({ placeholder }),
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
    if (editor && !isMarkdownMode && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor, isMarkdownMode]);

  const handleMarkdownChange = (markdown: string) => {
    onChange(markdown);
  };

  const convertMarkdownToHtml = (markdown: string) => {
    // Simple conversion for basic Markdown to HTML
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/\n/g, '<br>');
  };

  const convertHtmlToMarkdown = (html: string) => {
    // Simple conversion from HTML to Markdown
    return html
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```')
      .replace(/<br>/g, '\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n');
  };

  const switchToVisual = () => {
    if (isMarkdownMode) {
      const html = convertMarkdownToHtml(value);
      editor?.commands.setContent(html);
      setIsMarkdownMode(false);
    }
  };

  const switchToMarkdown = () => {
    if (!isMarkdownMode) {
      const markdown = convertHtmlToMarkdown(editor?.getHTML() || '');
      onChange(markdown);
      setIsMarkdownMode(true);
    }
  };

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
      {/* Editor Mode Toggle */}
      <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 rounded-lg">
        <button
          onClick={switchToVisual}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            !isMarkdownMode
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Visual
        </button>
        <button
          onClick={switchToMarkdown}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isMarkdownMode
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Markdown
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
        {isMarkdownMode ? (
          <textarea
            value={value}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            className="w-full h-full border-none outline-none bg-transparent resize-none text-gray-900 placeholder-gray-500 text-lg leading-relaxed font-mono p-4"
            placeholder={placeholder}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
