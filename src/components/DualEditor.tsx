'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import * as TiptapReact from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { createLowlight } from 'lowlight';
import { TextSelection, Selection } from '@tiptap/pm/state';
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

// Custom Text Color Extension
const TextColor = TiptapReact.Mark.create({
  name: 'textColor',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.color,
        renderHTML: (attributes: { color?: string }) => {
          if (!attributes.color) {
            return {};
          }
          return {
            style: `color: ${attributes.color}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="color"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

// Custom Background Color Extension
const BackgroundColor = TiptapReact.Mark.create({
  name: 'backgroundColor',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.backgroundColor,
        renderHTML: (attributes: { backgroundColor?: string }) => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="background-color"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

// Enhanced Table Cell Extension
const EnhancedTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.backgroundColor,
        renderHTML: (attributes: { backgroundColor?: string }) => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
      padding: {
        default: '0.5rem 0.75rem',
        parseHTML: (element: HTMLElement) => element.style.padding,
        renderHTML: (attributes: { padding?: string }) => {
          return {
            style: `padding: ${attributes.padding}`,
          };
        },
      },
    };
  },
});

// Enhanced Table Header Extension
const EnhancedTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: '#f9fafb',
        parseHTML: (element: HTMLElement) => element.style.backgroundColor,
        renderHTML: (attributes: { backgroundColor?: string }) => {
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
      textColor: {
        default: '#374151',
        parseHTML: (element: HTMLElement) => element.style.color,
        renderHTML: (attributes: { textColor?: string }) => {
          return {
            style: `color: ${attributes.textColor}`,
          };
        },
      },
    };
  },
});

// Enhanced Image Extension with positioning
const EnhancedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center',
        parseHTML: (element: HTMLElement) => element.style.textAlign || 'center',
        renderHTML: (attributes: { align?: string }) => {
          return {
            style: `text-align: ${attributes.align || 'center'}`,
          };
        },
      },
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.width,
        renderHTML: (attributes: { width?: string }) => {
          if (!attributes.width) return {};
          return {
            style: `width: ${attributes.width}`,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.height,
        renderHTML: (attributes: { height?: string }) => {
          if (!attributes.height) return {};
          return {
            style: `height: ${attributes.height}`,
          };
        },
      },
      caption: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const caption = element.nextElementSibling;
          return caption?.tagName === 'FIGCAPTION' ? caption.textContent : null;
        },
        renderHTML: (attributes: { caption?: string }) => {
          if (!attributes.caption) return {};
          return {
            'data-caption': attributes.caption,
          };
        },
      },
    };
  },
});

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

      {/* Text Color */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <input
            type="color"
            className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
            title="Text Color"
            defaultValue="#000000"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const color = e.target.value;
              if (color && color !== '#000000') {
                // Check if selection is in code block or link
                const isInCodeBlock = editor.isActive('codeBlock');
                const isInLink = editor.isActive('link');
                const isInCode = editor.isActive('code');
                
                if (!isInCodeBlock && !isInLink && !isInCode) {
                  handleButtonClick(() => {
                    editor.chain().focus().setMark('textColor', { color }).run();
                  });
                }
              }
            }}
          />
          {editor.isActive('textColor') && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white"></div>
          )}
        </div>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().unsetMark('textColor').run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('textColor')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Remove Text Color"
        >
          Clear
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Images */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleButtonClick(async () => {
            const url = window.prompt('Image URL');
            if (!url) return;
            editor.chain().focus().setImage({ src: url }).run();
          })}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Insert Image by URL"
        >
          Img URL
        </button>
        <button
          onClick={() => handleButtonClick(async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              const form = new FormData();
              form.append('file', file);
              const res = await fetch('/api/images', { method: 'POST', body: form });
              if (!res.ok) return;
              const { id } = await res.json();
              const url = `/api/images?id=${id}`;
              if (!url) return;
              editor.chain().focus().setImage({ src: url, alt: file.name }).run();
            };
            input.click();
          })}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Upload Image"
        >
          Upload
        </button>
      </div>

      {/* Image Positioning */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleButtonClick(() => {
            if (editor.isActive('image')) {
              editor.chain().focus().updateAttributes('image', { align: 'left' }).run();
            }
          })}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('image') && editor.getAttributes('image')?.align === 'left'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Align Image Left"
        >
          Img←
        </button>
        <button
          onClick={() => handleButtonClick(() => {
            if (editor.isActive('image')) {
              editor.chain().focus().updateAttributes('image', { align: 'center' }).run();
            }
          })}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('image') && editor.getAttributes('image')?.align === 'center'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Align Image Center"
        >
          Img↔
        </button>
        <button
          onClick={() => handleButtonClick(() => {
            if (editor.isActive('image')) {
              editor.chain().focus().updateAttributes('image', { align: 'right' }).run();
            }
          })}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('image') && editor.getAttributes('image')?.align === 'right'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Align Image Right"
        >
          Img→
        </button>
        <button
          onClick={() => handleButtonClick(() => {
            if (editor.isActive('image')) {
              const width = window.prompt('Image width (px, %, or auto):', '300px');
              if (width) {
                editor.chain().focus().updateAttributes('image', { width }).run();
              }
            }
          })}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Set Image Width"
        >
          Width
        </button>
        <button
          onClick={() => handleButtonClick(() => {
            if (editor.isActive('image')) {
              const caption = window.prompt('Image caption:', '');
              if (caption !== null) {
                editor.chain().focus().updateAttributes('image', { caption }).run();
              }
            }
          })}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Add Image Caption"
        >
          Caption
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
          &quot;
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

      {/* Text Alignment */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().setTextAlign('left').run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive({ textAlign: 'left' })
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Align Left"
        >
          ⬅
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().setTextAlign('center').run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive({ textAlign: 'center' })
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Align Center"
        >
          ↔
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().setTextAlign('right').run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive({ textAlign: 'right' })
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Align Right"
        >
          ➡
        </button>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().setTextAlign('justify').run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive({ textAlign: 'justify' })
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Justify"
        >
          ⬌
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Horizontal Rule */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().setHorizontalRule().run())}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Insert Horizontal Rule"
        >
          ─
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Background Color */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <input
            type="color"
            className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
            title="Background Color"
            defaultValue="#ffffff"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const color = e.target.value;
              if (color && color !== '#ffffff') {
                const isInCodeBlock = editor.isActive('codeBlock');
                const isInLink = editor.isActive('link');
                const isInCode = editor.isActive('code');
                
                if (!isInCodeBlock && !isInLink && !isInCode) {
                  handleButtonClick(() => {
                    editor.chain().focus().setMark('backgroundColor', { backgroundColor: color }).run();
                  });
                }
              }
            }}
          />
          {editor.isActive('backgroundColor') && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white"></div>
          )}
        </div>
        <button
          onClick={() => handleButtonClick(() => editor.chain().focus().unsetMark('backgroundColor').run())}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            editor.isActive('backgroundColor')
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Remove Background Color"
        >
          Clear BG
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Enhanced Tables */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            const rows = window.prompt('Number of rows:', '3');
            const cols = window.prompt('Number of columns:', '3');
            const withHeader = window.confirm('Include header row?');
            if (rows && cols) {
              handleButtonClick(() =>
                editor.chain().focus().insertTable({ 
                  rows: parseInt(rows), 
                  cols: parseInt(cols), 
                  withHeaderRow: withHeader 
                }).run()
              );
            }
          }}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Insert Table with Size Selection"
        >
          Table+
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Indentation Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleButtonClick(() => {
            const selection = editor.state.selection;
            const $from = selection.$from;
            const $to = selection.$to;
            const node = $from.node();
            
            // Add left margin to the current block
            const currentStyle = node.attrs.style || '';
            const currentMargin = currentStyle.match(/margin-left:\s*(\d+px)/)?.[1] || '0px';
            const newMargin = parseInt(currentMargin) + 20;
            
            editor.chain().focus().updateAttributes(node.type.name, {
              style: currentStyle.replace(/margin-left:\s*\d+px/, '') + `margin-left: ${newMargin}px;`
            }).run();
          })}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Indent Block"
        >
          →
        </button>
        <button
          onClick={() => handleButtonClick(() => {
            const selection = editor.state.selection;
            const $from = selection.$from;
            const $to = selection.$to;
            const node = $from.node();
            
            // Reduce left margin to the current block
            const currentStyle = node.attrs.style || '';
            const currentMargin = currentStyle.match(/margin-left:\s*(\d+px)/)?.[1] || '0px';
            const newMargin = Math.max(0, parseInt(currentMargin) - 20);
            
            editor.chain().focus().updateAttributes(node.type.name, {
              style: currentStyle.replace(/margin-left:\s*\d+px/, '') + (newMargin > 0 ? `margin-left: ${newMargin}px;` : '')
            }).run();
          })}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          title="Outdent Block"
        >
          ←
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorPaneRef = useRef<HTMLDivElement | null>(null);
  const [tableMenu, setTableMenu] = useState<{ visible: boolean; left: number; top: number }>({ visible: false, left: 0, top: 0 });
  const [resizeTip, setResizeTip] = useState<{ visible: boolean; left: number; top: number; text: string }>({ visible: false, left: 0, top: 0, text: '' });
  const lastImageIdsRef = useRef<Set<number>>(new Set());
  const scheduledDeletesRef = useRef<Map<number, number>>(new Map());

  // Upload image helper -> returns served URL
  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/images', { method: 'POST', body: form });
      if (!res.ok) return null;
      const { id } = await res.json();
      return `/api/images?id=${id}`;
    } catch {
      return null;
    }
  };

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
        /* Disable native link interaction during editing by default */
        pointer-events: none;
        cursor: text;
      }
      .tiptap a:hover {
        color: #047857;
      }
      /* Re-enable link interaction only when Ctrl/Cmd pressed */
      [data-allow-link-click='true'] .tiptap a {
        pointer-events: auto;
        cursor: pointer;
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



      /* Enhanced Table styles */
      .tiptap table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .tiptap th, .tiptap td {
        border: 1px solid #e5e7eb;
        padding: 0.75rem 1rem;
        text-align: left;
        vertical-align: top;
      }
      .tiptap thead th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
        border-bottom: 2px solid #e5e7eb;
      }
      .tiptap tbody tr:nth-child(odd) {
        background: #fafafa;
      }
      .tiptap tbody tr:hover {
        background: #f3f4f6;
      }

      /* Horizontal Rule styles */
      .tiptap hr {
        border: none;
        border-top: 2px solid #e5e7eb;
        margin: 1.5rem 0;
        height: 1px;
      }
      .tiptap hr:hover {
        border-top-color: #d1d5db;
      }

      /* Text alignment styles */
      .tiptap .text-left {
        text-align: left;
      }
      .tiptap .text-center {
        text-align: center;
      }
      .tiptap .text-right {
        text-align: right;
      }
      .tiptap .text-justify {
        text-align: justify;
      }

      /* Image positioning and caption styles */
      .tiptap img {
        display: block;
        margin: 1rem auto;
        max-width: 100%;
        height: auto;
      }
      
      .tiptap img[style*="text-align: left"] {
        margin-left: 0;
        margin-right: auto;
        float: left;
        margin-right: 1rem;
      }
      
      .tiptap img[style*="text-align: right"] {
        margin-left: auto;
        margin-right: 0;
        float: right;
        margin-left: 1rem;
      }
      
      .tiptap img[style*="text-align: center"] {
        margin-left: auto;
        margin-right: auto;
        float: none;
      }
      
      .tiptap img[data-caption]::after {
        content: attr(data-caption);
        display: block;
        text-align: center;
        font-style: italic;
        color: #6b7280;
        margin-top: 0.5rem;
        font-size: 0.875rem;
      }

      /* Enhanced content positioning styles */
      .tiptap p, .tiptap h1, .tiptap h2, .tiptap h3, .tiptap h4, .tiptap h5, .tiptap h6 {
        margin: 0.75rem 0;
        line-height: 1.6;
      }
      
      .tiptap p:first-child, .tiptap h1:first-child, .tiptap h2:first-child, 
      .tiptap h3:first-child, .tiptap h4:first-child, .tiptap h5:first-child, 
      .tiptap h6:first-child {
        margin-top: 0;
      }
      
      .tiptap p:last-child, .tiptap h1:last-child, .tiptap h2:last-child, 
      .tiptap h3:last-child, .tiptap h4:last-child, .tiptap h5:last-child, 
      .tiptap h6:last-child {
        margin-bottom: 0;
      }
      
      /* Block spacing controls */
      .tiptap .block-spacing-small {
        margin: 0.5rem 0;
      }
      
      .tiptap .block-spacing-medium {
        margin: 1rem 0;
      }
      
      .tiptap .block-spacing-large {
        margin: 1.5rem 0;
      }
      
      /* Indentation styles */
      .tiptap .indent-1 { margin-left: 1rem; }
      .tiptap .indent-2 { margin-left: 2rem; }
      .tiptap .indent-3 { margin-left: 3rem; }
      .tiptap .indent-4 { margin-left: 4rem; }

      /* Column resize UI (TipTap/ProseMirror tables) */
      .tiptap .column-resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: 0;
        width: 4px;
        background: rgba(16, 185, 129, 0.25); /* emerald-500 @ 25% */
        cursor: col-resize;
        z-index: 5;
      }
      .tiptap .resize-cursor {
        cursor: col-resize !important;
      }
      .tiptap .selectedCell::after {
        content: '';
        position: absolute;
        left: 0; right: 0; top: 0; bottom: 0;
        background: rgba(16, 185, 129, 0.08);
        pointer-events: none;
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
        horizontalRule: false, // Disable to avoid conflict with our custom extension
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        protocols: ['http', 'https', 'mailto', 'tel'],
      }),
      EnhancedImage.configure({
        HTMLAttributes: {
          class: 'rounded-md max-w-full h-auto',
        },
        allowBase64: true,
      }),
      CodeBlockWithToolbar.configure({ lowlight }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      EnhancedTableHeader,
      EnhancedTableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      HorizontalRule,
      TextColor,
      BackgroundColor,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== value) {
        debouncedOnChange(html);
      }
    },
    immediatelyRender: false,
    editorProps: {
      handleDOMEvents: {
        dragenter: (view, event) => {
          const e = event as DragEvent;
          if (!e.dataTransfer) return false;
          e.preventDefault();
          try { e.dataTransfer.dropEffect = 'copy'; } catch {}
          return true;
        },
        dragover: (view, event) => {
          const e = event as DragEvent;
          if (!e.dataTransfer) return false;
          const hasFiles = e.dataTransfer.files && e.dataTransfer.files.length > 0;
          const hasUrl = (e.dataTransfer.types || []).includes('text/uri-list');
          if (hasFiles || hasUrl) {
            e.preventDefault();
            try { e.dataTransfer.dropEffect = 'copy'; } catch {}
            return true;
          }
          return false;
        },
        mousedown: (view, event) => {
          if (!view.editable) return false;
          const e = event as MouseEvent;
          const target = e.target as HTMLElement | null;
          if (!target) return false;
          const anchor = (target.closest && target.closest('a')) as HTMLAnchorElement | null;
          if (!anchor) return false;
          // Only intercept Ctrl/Cmd so we can open in click handler;
          // otherwise allow ProseMirror to place the caret.
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            return true;
          }
          return false;
        },
        click: (view, event) => {
          if (!view.editable) return false;
          const e = event as MouseEvent;
          const target = e.target as HTMLElement | null;
          if (!target) return false;
          const anchor = (target.closest && target.closest('a')) as HTMLAnchorElement | null;
          if (!anchor) return false;
          const href = anchor.getAttribute('href');
          if (!href) return true;
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd-click: open in new tab and stop handling
            e.preventDefault();
            e.stopPropagation();
            try {
              window.open(href, '_blank', 'noopener');
            } catch {}
            return true;
          }
          // Normal click: stop everything and do not navigate
          e.preventDefault();
          e.stopImmediatePropagation?.();
          return true;
        },
      },
      handlePaste(view, event) {
        const e = event as ClipboardEvent;
        const items = e.clipboardData?.items;
        if (!items || items.length === 0) return false;
        const imageItems = Array.from(items).filter(it => it.type && it.type.startsWith('image/'));
        if (imageItems.length === 0) return false;
        e.preventDefault();
        imageItems.forEach(async it => {
          const file = it.getAsFile();
          if (!file) return;
          const url = await uploadImageFile(file);
          if (!url) return;
          try {
            const imageNode = view.state.schema.nodes.image.create({ src: url, alt: file.name });
            const tr = view.state.tr.replaceSelectionWith(imageNode, false).scrollIntoView();
            view.dispatch(tr);
          } catch {}
        });
        return true;
      },
      handleDrop(view, event) {
        const e = event as DragEvent;
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) {
          // Fall back to URL drops
          const urlList = e.dataTransfer?.getData('text/uri-list');
          if (!urlList) return false;
          e.preventDefault();
          e.stopPropagation();
          const coords = { left: e.clientX, top: e.clientY } as any;
          const posAt = view.posAtCoords(coords)?.pos;
          if (typeof posAt === 'number') {
            const $pos = view.state.doc.resolve(posAt);
            const tr = view.state.tr.setSelection(new TextSelection($pos));
            view.dispatch(tr);
          }
          const firstUrl = urlList.split('\n')[0];
          (async () => {
            try {
              const resp = await fetch(firstUrl);
              const blob = await resp.blob();
              if (!blob.type.startsWith('image/')) return;
              const form = new FormData();
              form.append('file', new File([blob], 'dropped-image', { type: blob.type }));
              const res = await fetch('/api/images', { method: 'POST', body: form });
              if (!res.ok) return;
              const { id } = await res.json();
              const url = `/api/images?id=${id}`;
              const imageNode = view.state.schema.nodes.image.create({ src: url, alt: 'image' });
              const tr2 = view.state.tr.replaceSelectionWith(imageNode, false).scrollIntoView();
              view.dispatch(tr2);
            } catch {}
          })();
          return true;
        }
        const imageFiles = Array.from(files).filter(f => (f.type && f.type.startsWith('image/')) || (!f.type && /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name)) );
        if (imageFiles.length === 0) return false;
        e.preventDefault();
        e.stopPropagation();
        // Determine drop position
        const coords = { left: e.clientX, top: e.clientY } as any;
        const posAt = view.posAtCoords(coords)?.pos;
        if (typeof posAt === 'number') {
          const $pos = view.state.doc.resolve(posAt);
          const tr = view.state.tr.setSelection(new TextSelection($pos));
          view.dispatch(tr);
        }
        imageFiles.forEach(async file => {
          const url = await uploadImageFile(file);
          if (!url) return;
          try {
            const imageNode = view.state.schema.nodes.image.create({ src: url, alt: file.name });
            const tr = view.state.tr.replaceSelectionWith(imageNode, false).scrollIntoView();
            view.dispatch(tr);
          } catch {}
        });
        return true;
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Link clicks handled via editorProps.handleDOMEvents.click

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

  // Track selection to position inline table menu
  useEffect(() => {
    if (!editor) return;
    const updateMenu = () => {
      try {
        const isInTable = editor.isActive('table');
        if (!isInTable) {
          setTableMenu((m) => (m.visible ? { visible: false, left: 0, top: 0 } : m));
          return;
        }
        const view = editor.view;
        const { from } = editor.state.selection as any;
        const start = view.coordsAtPos(from);
        const container = editorPaneRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const left = Math.max(8, start.left - rect.left);
        const top = Math.max(8, start.top - rect.top - 36);
        setTableMenu({ visible: true, left, top });
      } catch {
        // ignore
      }
    };
    const unsubscribe = editor.on('selectionUpdate', updateMenu);
    const unsubscribe2 = editor.on('transaction', updateMenu);
    updateMenu();
    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('transaction', updateMenu);
    };
  }, [editor]);

  // Immediate image cleanup with grace period (prevents DB bloat if user backspaces)
  useEffect(() => {
    if (!editor) return;

    const getCurrentImageIds = (): Set<number> => {
      const ids = new Set<number>();
      try {
        const html = editor.getHTML();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const imgs = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
        imgs.forEach(img => {
          try {
            const u = new URL(img.getAttribute('src') || '', window.location.origin);
            const id = u.searchParams.get('id');
            if (id) ids.add(parseInt(id));
          } catch {}
        });
      } catch {}
      return ids;
    };

    // Initialize on mount
    lastImageIdsRef.current = getCurrentImageIds();

    const handleDocChange = () => {
      const currentIds = getCurrentImageIds();
      // Cancel any scheduled delete for images that reappeared
      scheduledDeletesRef.current.forEach((timeoutId, imgId) => {
        if (currentIds.has(imgId)) {
          clearTimeout(timeoutId);
          scheduledDeletesRef.current.delete(imgId);
        }
      });
      // Schedule deletes for removed ids
      lastImageIdsRef.current.forEach((imgId) => {
        if (!currentIds.has(imgId) && !scheduledDeletesRef.current.has(imgId)) {
          const t = window.setTimeout(async () => {
            // Double-check it has not reappeared
            const latestIds = getCurrentImageIds();
            if (!latestIds.has(imgId)) {
              try { await fetch(`/api/images?id=${imgId}`, { method: 'DELETE' }); } catch {}
            }
            scheduledDeletesRef.current.delete(imgId);
          }, 5000); // 5s grace period for undo
          scheduledDeletesRef.current.set(imgId, t);
        }
      });
      lastImageIdsRef.current = currentIds;
    };

    const offUpdate = editor.on('update', handleDocChange);
    const offTransaction = editor.on('transaction', handleDocChange);
    // Run once initially
    handleDocChange();

    return () => {
      editor.off('update', handleDocChange);
      editor.off('transaction', handleDocChange);
      // Clear any pending timers
      scheduledDeletesRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      scheduledDeletesRef.current.clear();
    };
  }, [editor]);

  // Column-resize handle tooltip (hover/drag line indicator)
  useEffect(() => {
    const pane = editorPaneRef.current;
    if (!pane || !editor) return;

    const updateTipPosition = (e: MouseEvent, text?: string) => {
      const rect = pane.getBoundingClientRect();
      setResizeTip(prev => ({
        visible: true,
        left: e.clientX - rect.left + 8,
        top: e.clientY - rect.top + 12,
        text: (text ?? prev.text) || 'Drag to resize column',
      }));
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const handle = target.closest('.column-resize-handle') as HTMLElement | null;
      if (!handle) return;
      updateTipPosition(e, 'Drag to resize column');
    };

    const onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) {
        setResizeTip(prev => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const handle = target.closest('.column-resize-handle') as HTMLElement | null;
      if (!handle) {
        setResizeTip(prev => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const cell = handle.closest('th,td') as HTMLElement | null;
      const widthPx = cell ? Math.round(cell.offsetWidth) : undefined;
      updateTipPosition(e, widthPx ? `Width: ${widthPx}px` : 'Drag to resize column');
    };

    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const handle = target.closest('.column-resize-handle') as HTMLElement | null;
      if (!handle) return;
      updateTipPosition(e, 'Resizing…');
      const onUp = () => {
        setResizeTip(prev => ({ ...prev, visible: false }));
        document.removeEventListener('mouseup', onUp, true);
      };
      document.addEventListener('mouseup', onUp, true);
    };

    const onLeave = () => setResizeTip(prev => (prev.visible ? { ...prev, visible: false } : prev));

    pane.addEventListener('mouseover', onOver, true);
    pane.addEventListener('mousemove', onMove, true);
    pane.addEventListener('mousedown', onDown, true);
    pane.addEventListener('mouseleave', onLeave, true);
    return () => {
      pane.removeEventListener('mouseover', onOver, true);
      pane.removeEventListener('mousemove', onMove, true);
      pane.removeEventListener('mousedown', onDown, true);
      pane.removeEventListener('mouseleave', onLeave, true);
    };
  }, [editor]);

  // Final safety net: capture-phase blocker on the editor container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (ev: Event) => {
      const e = ev as MouseEvent;
      if (!editor?.isEditable) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = (target.closest && target.closest('a')) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (e.ctrlKey || e.metaKey) {
        // Block native navigation; allow inner handler to open window
        e.preventDefault();
        return;
      }
      // Block normal navigation entirely while editing
      e.preventDefault();
      // Stop bubbling to any outer listeners
      // Using optional chaining for cross-browser safety
      (e as any).stopImmediatePropagation?.();
      e.stopPropagation();
    };
    el.addEventListener('click', handler, true);
    return () => el.removeEventListener('click', handler, true);
  }, [editor]);

  // Toggle link interactivity via Ctrl/Cmd key to support pointer-events strategy
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        el.setAttribute('data-allow-link-click', 'true');
      }
    };
    const onKeyUp = () => {
      el.removeAttribute('data-allow-link-click');
    };
    const onBlur = () => {
      el.removeAttribute('data-allow-link-click');
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onBlur, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur, true);
    };
  }, []);

  // Global capture-phase guard to beat any outer handlers
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      if (!editor?.isEditable) return;
      const root = editor.view.dom as HTMLElement;
      const target = ev.target as HTMLElement | null;
      if (!target || !root.contains(target)) return;
      const anchor = (target.closest && target.closest('a')) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (ev.ctrlKey || ev.metaKey) {
        ev.preventDefault();
        try { window.open(href, '_blank', 'noopener'); } catch {}
      } else {
        ev.preventDefault();
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [editor]);

  return (
    <div ref={containerRef} className="h-full flex flex-col">
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
          <div ref={editorPaneRef} className="flex-1 p-4 overflow-y-auto min-h-0 relative">
            {resizeTip.visible && (
              <div
                className="absolute z-50 text-[11px] px-2 py-1 rounded bg-gray-800 text-white shadow"
                style={{ left: resizeTip.left, top: resizeTip.top }}
              >
                {resizeTip.text}
              </div>
            )}
            {/* Inline table controls overlay */}
            {editor && tableMenu.visible && (
              <div
                className="absolute z-50 rounded-md shadow bg-white border border-gray-200 p-1 flex flex-wrap gap-1"
                style={{ left: tableMenu.left, top: Math.max(0, tableMenu.top) }}
              >
                <button onClick={() => editor.chain().focus().addRowBefore().run()} className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" title="Add Row Above">+Row↑</button>
                <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" title="Add Row Below">+Row↓</button>
                <button onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" title="Delete Row">−Row</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" title="Add Column Left">+Col←</button>
                <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" title="Add Column Right">+Col→</button>
                <button onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" title="Delete Column">−Col</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => editor.chain().focus().toggleHeaderRow().run()} className={`px-2 py-1 text-xs rounded border ${editor.isActive('tableHeader') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'}`} title="Toggle Header Row">Header</button>
                <button onClick={() => editor.chain().focus().mergeCells().run()} className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" title="Merge Cells">Merge</button>
                <button onClick={() => editor.chain().focus().splitCell().run()} className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" title="Split Cell">Split</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button 
                  onClick={() => {
                    const color = window.prompt('Enter background color (hex, rgb, or name):', '#f0f0f0');
                    if (color) {
                      editor.chain().focus().updateAttributes('tableCell', { backgroundColor: color }).run();
                    }
                  }} 
                  className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" 
                  title="Set Cell Background Color"
                >
                  BG Color
                </button>
                <button 
                  onClick={() => editor.chain().focus().updateAttributes('tableCell', { backgroundColor: null }).run()} 
                  className="px-2 py-1 text-xs rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800" 
                  title="Clear Cell Background Color"
                >
                  Clear BG
                </button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 text-xs rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-700" title="Delete Table">Delete</button>
              </div>
            )}

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
