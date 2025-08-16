'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DualEditor from '@/components/DualEditor';
import TagInput from '@/components/TagInput';
import FolderSelector from '@/components/FolderSelector';
import Sidebar from '@/components/Sidebar';
import { createLowlight } from 'lowlight';
import 'highlight.js/styles/github-dark.css';

interface Note {
  id: number;
  title: string;
  content: string;
  folder_id: number | null;
  created_at: string;
  updated_at: string;
  tags: string;
}

type SortMethod = 'title' | 'created_at' | 'updated_at';

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<number | 'no-folder' | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentNoteFolderId, setCurrentNoteFolderId] = useState<number | null>(null);
  const [folders, setFolders] = useState<Array<{id: number, name: string, parent_id: number | null, icon?: string | null}>>([]);
  const [folderMeta, setFolderMeta] = useState<Record<number, { count: number; latest?: string }>>({});
  const [collapsedFolders, setCollapsedFolders] = useState<Record<number, boolean>>({});
  const [collapsedNoFolder, setCollapsedNoFolder] = useState<boolean>(false);
  const [selectedFolderSettingsId, setSelectedFolderSettingsId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderIcon, setEditFolderIcon] = useState('');
  const [emojiPickerOpenFor, setEmojiPickerOpenFor] = useState<number | null>(null);
  const [sortMethod, setSortMethod] = useState<SortMethod>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const EMOJI_OPTIONS = [
    '📁','📄','📝','📚','💡','🧪','🧰','🔧','🗂️','🗃️','🗒️','📦','🕹️','🧠','🎯','🚀','🧩','��','💻','⚙️'
  ];

  const computeFolderMeta = (notesList: Note[]) => {
    const meta: Record<number, { count: number; latest?: string }> = {};
    for (const n of notesList) {
      if (n.folder_id !== null) {
        const m = meta[n.folder_id] || { count: 0, latest: undefined };
        m.count += 1;
        if (!m.latest || new Date(n.updated_at) > new Date(m.latest)) {
          m.latest = n.updated_at;
        }
        meta[n.folder_id] = m;
      }
    }
    return meta;
  };

  useEffect(() => {
    setFolderMeta(computeFolderMeta(notes));
  }, [notes]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [lowlight, setLowlight] = useState<any>(null);

  // Configure lowlight for syntax highlighting (client-side only)
  useEffect(() => {
    const initLowlight = async () => {
      const { createLowlight } = await import('lowlight');
      const js = (await import('highlight.js/lib/languages/javascript')).default;
      const ts = (await import('highlight.js/lib/languages/typescript')).default;
      const python = (await import('highlight.js/lib/languages/python')).default;
      const java = (await import('highlight.js/lib/languages/java')).default;
      const xml = (await import('highlight.js/lib/languages/xml')).default;
      const css = (await import('highlight.js/lib/languages/css')).default;
      
      const lowlightInstance = createLowlight();
      lowlightInstance.register({ javascript: js, js });
      lowlightInstance.register({ typescript: ts, ts });
      lowlightInstance.register({ python });
      lowlightInstance.register({ java });
      // HTML is handled by highlight.js's 'xml' grammar; register aliases for convenience
      lowlightInstance.register({ html: xml, xml });
      lowlightInstance.register({ css });
      
      setLowlight(lowlightInstance);
    };
    
    initLowlight();
  }, []);

  // Helper functions for tags
  const parseTags = (tagsString: string): string[] => {
    if (!tagsString) return [];
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  const formatTags = (tags: string[]): string => {
    return tags.join(', ');
  };

  const sortNotes = (notesToSort: Note[]): Note[] => {
    return [...notesToSort].sort((a, b) => {
      let comparison = 0;

      switch (sortMethod) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Check if we should highlight folders/tags based on selected note
  const shouldHighlightFromSelectedNote = () => {
    // Only highlight when no folder or tag is selected (showing all notes)
    return selectedNote && selectedFolderId === null && selectedTag === null;
  };

  // Get the folder ID that should be highlighted
  const getHighlightedFolderId = () => {
    if (shouldHighlightFromSelectedNote() && selectedNote) {
      return selectedNote.folder_id;
    }
    return null;
  };

  // Get the tags that should be highlighted
  const getHighlightedTags = () => {
    if (shouldHighlightFromSelectedNote() && selectedNote) {
      return parseTags(selectedNote.tags);
    }
    return [];
  };

  const handleNoteDrop = async (noteId: number, folderId: number | null) => {
    try {
      const noteToUpdate = notes.find(n => n.id === noteId);
      if (!noteToUpdate) return;

      const updatedNote = {
        ...noteToUpdate,
        folder_id: folderId
      };

      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote),
      });

      if (response.ok) {
        const updatedNoteData = await response.json();
        setNotes(prev => prev.map(n => n.id === noteId ? updatedNoteData : n));
        
        // Update selected note if it's the one being moved
        if (selectedNote?.id === noteId) {
          setSelectedNote(updatedNoteData);
          setCurrentNoteFolderId(updatedNoteData.folder_id);
        }
      }
    } catch (error) {
      console.error('Error moving note to folder:', error);
    }
  };

  // Detect if note content is HTML (from TipTap) vs Markdown
  const isHtmlContent = (content: string): boolean => {
    const trimmed = (content || '').trim();
    // Consider it HTML only if it starts with a tag
    return /^</.test(trimmed);
  };

  // Function to apply syntax highlighting to HTML content
  const applySyntaxHighlighting = (htmlContent: string) => {
    if (!lowlight) return htmlContent; // Return original content if lowlight not ready
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Find all code blocks and highlight them
    const codeBlocks = doc.querySelectorAll('pre code');
    codeBlocks.forEach((codeElement) => {
      // Get language from the code element or its parent pre element
      const language = codeElement.getAttribute('data-language') || 
                     codeElement.parentElement?.getAttribute('data-language') || 
                     'javascript';
      const code = codeElement.textContent || '';
      
      console.log('data-language attribute:', codeElement.getAttribute('data-language'));
      console.log('Highlighting code with language:', language);
      console.log('Code content:', code);
      
      try {
        // Use lowlight's highlight method with the specific language
        // Ensure we're using the correct language from data-language attribute
        const highlighted = lowlight.highlight(language, code);
        
        // Convert the highlighted result to HTML string using a more robust approach
        let highlightedHtml = '';
        
        const escapeHtml = (s: string) =>
          s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const processNode = (node: any): string => {
          if (typeof node === 'string') {
            return escapeHtml(node);
          } else if (node.type === 'element') {
            const className = Array.isArray(node.properties?.className) 
              ? node.properties.className.join(' ') 
              : node.properties?.className || '';
            const content = node.children?.map(processNode).join('') || '';
            return `<span class="token ${className}">${content}</span>`;
          } else if (node.type === 'text') {
            return escapeHtml(node.value || '');
          } else {
            return escapeHtml(node.value || '');
          }
        };
        
        highlightedHtml = highlighted.children.map(processNode).join('');
        codeElement.innerHTML = highlightedHtml;
        codeElement.className = `language-${language}`;
      } catch (error) {
        // If language is not supported, just keep the original content
        console.warn(`Language ${language} not supported for highlighting`);
      }
    });
    
    return doc.body.innerHTML;
  };

  // Fetch notes when folder or tag selection changes
  useEffect(() => {
    // Only fetch when selectedFolderId or selectedTag changes (not on initial load)
    if (selectedFolderId !== undefined || selectedTag !== undefined) {
      console.log('useEffect triggered - selectedFolderId changed to:', selectedFolderId);
      console.log('useEffect triggered - selectedTag changed to:', selectedTag);
      fetchNotes();
    }
  }, [selectedFolderId, selectedTag]);

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  useEffect(() => {
    fetchFolders();
    fetchNotes(); // Initial load
  }, []);

  // Update current note folder when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setCurrentNoteFolderId(selectedNote.folder_id);
    }
  }, [selectedNote]);

  const fetchNotes = async () => {
    if (isFetching) return; // Prevent multiple simultaneous calls
    
    try {
      setIsFetching(true);
      let url = '/api/notes';
      if (selectedTag !== null) {
        url = `/api/notes?tag=${encodeURIComponent(selectedTag)}`;
      } else if (selectedFolderId !== null) {
        // If selectedFolderId is a number, filter by that folder
        // If selectedFolderId is 'no-folder', filter for notes with no folder
        if (selectedFolderId === 'no-folder') {
          url = '/api/notes?no_folder=true';
        } else {
          url = `/api/notes?folder_id=${selectedFolderId}`;
        }
      }
      console.log('Fetching notes with URL:', url);
      console.log('Selected folder ID:', selectedFolderId);
      console.log('Selected tag:', selectedTag);
      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      const data = await response.json();
      console.log('Fetched notes:', data);
      console.log('Data type:', typeof data);
      console.log('Data length:', Array.isArray(data) ? data.length : 'not an array');
      setNotes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setLoading(false);
    } finally {
      setIsFetching(false);
    }
  };

  const createNewNote = async () => {
    try {
      const noteData = {
        title: 'Untitled Note',
        content: '',
        tags: '',
        folder_id: typeof selectedFolderId === 'number' ? selectedFolderId : null
      };
      
      console.log('Sending note data:', noteData);
      
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const newNote = await response.json();
        console.log('Created note:', newNote);
        setNotes(prev => [newNote, ...prev]);
        setSelectedNote(newNote);
        setCurrentNoteFolderId(newNote.folder_id);
        setIsEditing(true);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const updateNote = async (note: Note) => {
    try {
      // Sweep removed images: compare previous and new content image ids (DOM-based parsing)
      const prev = notes.find(n => n.id === note.id);
      const getIds = (html: string | undefined) => {
        const ids = new Set<number>();
        if (!html) return ids;
        try {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const images = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
          images.forEach(img => {
            try {
              const u = new URL(img.getAttribute('src') || '', window.location.origin);
              const id = u.searchParams.get('id');
              if (id) ids.add(parseInt(id));
            } catch {}
          });
        } catch {}
        return ids;
      };
      const beforeIds = getIds(prev?.content);
      const afterIds = getIds(note.content);
      const removed: number[] = Array.from(beforeIds).filter(id => !afterIds.has(id));

      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(note),
      });
      
      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n));
        setSelectedNote(updatedNote);
        // Fire-and-forget deletion of removed images
        removed.forEach(async (id) => {
          try { await fetch(`/api/images?id=${id}`, { method: 'DELETE' }); } catch {}
        });
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (noteId: number) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleNoteFolderChange = async (folderId: number | null) => {
    if (!selectedNote) return;
    
    console.log('Changing note folder to:', folderId);
    
    try {
      const updatedNote = { ...selectedNote, folder_id: folderId };
      console.log('Updated note data:', updatedNote);
      
      const response = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote),
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const updatedNoteData = await response.json();
        console.log('Updated note response:', updatedNoteData);
        setNotes(prev => prev.map(n => n.id === selectedNote.id ? updatedNoteData : n));
        setSelectedNote(updatedNoteData);
        setCurrentNoteFolderId(updatedNoteData.folder_id);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error updating note folder:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        selectedFolderId={selectedFolderId}
        selectedTag={selectedTag}
        onFolderSelect={setSelectedFolderId}
        onTagSelect={setSelectedTag}
        onCreateNote={createNewNote}
        onNoteDrop={handleNoteDrop}
        highlightedFolderId={getHighlightedFolderId()}
        highlightedTags={getHighlightedTags()}
      />

      {/* Notes List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Notes List Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-gray-700">Notes</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {notes.length}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <select
              value={sortMethod}
              onChange={(e) => setSortMethod(e.target.value as SortMethod)}
              className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:border-emerald-500 text-gray-700"
            >
              <option value="title">Title</option>
              <option value="created_at">Created</option>
              <option value="updated_at">Updated</option>
            </select>
            <button
              onClick={toggleSortDirection}
              className="text-red-500 hover:text-red-700 text-xs p-1"
              title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {selectedTag ? `No notes with tag "${selectedTag}"` : 
               selectedFolderId === 'no-folder' ? 'No notes without folder' :
               selectedFolderId ? 'No notes in this folder' :
               'No notes yet. Create your first note!'}
            </div>
          ) : (
            <div className="p-2">
              {sortNotes(notes).map((note) => (
                <div
                  key={note.id}
                  draggable
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedNote?.id === note.id
                      ? 'bg-emerald-100 border-emerald-300 border'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedNote(note);
                    setIsEditing(false);
                  }}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', note.id.toString());
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove('opacity-50');
                  }}
                  onDrag={(e) => {
                    e.currentTarget.classList.add('opacity-50');
                  }}
                >
                  <h3 className="font-medium text-gray-900 truncate text-base">{note.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {note.content
                      ? note.content
                          .replace(/<[^>]*>/g, '')
                          .replace(/^#+\s+/gm, '')
                          .replace(/\*\*(.*?)\*\*/g, '$1')
                          .replace(/\*(.*?)\*/g, '$1')
                          .replace(/`(.*?)`/g, '$1')
                          .replace(/^- (.*$)/gm, '$1')
                          .replace(/^(\d+)\. (.*$)/gm, '$2')
                          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                          .replace(/\n+/g, ' ')
                          .replace(/\s+/g, ' ')
                          .trim()
                          .substring(0, 100) + (note.content.length > 100 ? '...' : '')
                      : 'No content'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedFolderSettingsId ? (
          <>
            {/* Folder Settings Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    className="text-emerald-600 hover:text-emerald-700"
                    onClick={() => setSelectedFolderSettingsId(null)}
                  >
                    ← Back
                  </button>
                  <h2 className="text-xl font-semibold text-gray-800">Folder Settings</h2>
                </div>
                <div className="text-sm text-gray-500">
                  {(() => {
                    const meta = folderMeta[selectedFolderSettingsId!];
                    return meta ? `${meta.count} notes` : '';
                  })()}
                </div>
              </div>
            </div>

            {/* Folder Settings Content */}
            <div className="flex-1 p-6 bg-white">
              {(() => {
                const folder = folders.find(f => f.id === selectedFolderSettingsId)!;
                return (
                  <div className="max-w-2xl space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        className="w-full text-base border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                      <div className="flex items-center gap-2 relative">
                        <input
                          value={editFolderIcon}
                          onChange={(e) => setEditFolderIcon(e.target.value)}
                          placeholder="e.g. 📁, 💡, 📚"
                          className="flex-1 text-base border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-500"
                        />
                        <button
                          type="button"
                          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                          onClick={() => setEmojiPickerOpenFor((cur) => (cur === folder.id ? null : folder.id))}
                        >
                          😀
                        </button>
                        {emojiPickerOpenFor === folder.id && (
                          <div className="absolute top-10 left-0 z-10 bg-white border border-gray-200 rounded shadow p-2 w-60">
                            <div className="grid grid-cols-8 gap-1 text-base">
                              {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className="hover:bg-gray-100 rounded"
                                  onClick={() => {
                                    setEditFolderIcon(emoji);
                                    setEmojiPickerOpenFor(null);
                                  }}
                                  title={emoji}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <button
                                type="button"
                                className="text-xs text-gray-600 hover:text-gray-800"
                                onClick={() => setEmojiPickerOpenFor(null)}
                              >
                                Close
                              </button>
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:text-red-700"
                                onClick={() => { setEditFolderIcon(''); setEmojiPickerOpenFor(null); }}
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        onClick={async () => {
                          if (!folder) return;
                          try {
                            const res = await fetch(`/api/folders/${folder.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: editFolderName.trim() || folder.name, parent_id: folder.parent_id, icon: editFolderIcon || null }),
                            });
                            if (res.ok) {
                              const updated = await res.json();
                              setFolders((prev) => prev.map((f) => (f.id === folder.id ? updated : f)));
                              setSelectedFolderSettingsId(null);
                              setEmojiPickerOpenFor(null);
                            }
                          } catch (e) {
                            console.error('Failed to update folder', e);
                          }
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        onClick={() => { setSelectedFolderSettingsId(null); setEmojiPickerOpenFor(null); }}
                      >
                        Cancel
                      </button>
                      <button
                        className="ml-auto px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                        onClick={async () => {
                          if (!folder) return;
                          if (!confirm('Delete this folder? Notes will be moved to No folder.')) return;
                          try {
                            const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setFolders((prev) => prev.filter((f) => f.id !== folder.id));
                              setNotes((prev) => prev.map((n) => (n.folder_id === folder.id ? { ...n, folder_id: null } : n)));
                              setSelectedFolderSettingsId(null);
                              setEmojiPickerOpenFor(null);
                            }
                          } catch (e) {
                            console.error('Failed to delete folder', e);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        ) : selectedNote ? (
          <>
            {/* Note Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    {isEditing ? 'View' : 'Edit'}
                  </button>
                  <div className="w-48">
                    <FolderSelector
                      key={`folder-selector-${selectedNote?.id}-${currentNoteFolderId}`}
                      selectedFolderId={currentNoteFolderId}
                      onFolderChange={handleNoteFolderChange}
                    />
                  </div>
                </div>
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Note Content */}
            <div className="flex-1 p-6 bg-white">
              {isEditing ? (
                <div className="space-y-4 h-full">
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => {
                      const updated = { ...selectedNote, title: e.target.value };
                      setSelectedNote(updated);
                      updateNote(updated);
                    }}
                    className="w-full text-2xl font-bold border-none outline-none bg-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Note title..."
                  />
                  <TagInput
                    tags={parseTags(selectedNote.tags)}
                    onChange={(tags) => {
                      const updated = { ...selectedNote, tags: formatTags(tags) };
                      setSelectedNote(updated);
                      updateNote(updated);
                    }}
                    placeholder="Add tags..."
                  />
                  <div className="flex-1">
                    <DualEditor
                      value={selectedNote.content}
                      onChange={(content) => {
                        const updated = { ...selectedNote, content };
                        setSelectedNote(updated);
                        updateNote(updated);
                      }}
                      placeholder="Start writing your note..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-gray-900">{selectedNote.title}</h1>
                  {parseTags(selectedNote.tags).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {parseTags(selectedNote.tags).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="prose max-w-none">
                    <div className="text-gray-800 text-lg leading-relaxed">
                      {isHtmlContent(selectedNote.content) ? (
                        // Content is HTML from TipTap editor
                        <div className="prose prose-lg max-w-none tiptap-view"
                          dangerouslySetInnerHTML={{ __html: applySyntaxHighlighting(selectedNote.content) }}
                        />
                      ) : (
                        // Content is markdown
                        <div className="prose prose-lg max-w-none tiptap-view">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                            // Use default table structure; styling handled via CSS to match editor
                            h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 mb-4">{children}</h1>,
                            h2: ({children}) => <h2 className="text-2xl font-bold text-gray-900 mb-3">{children}</h2>,
                            h3: ({children}) => <h3 className="text-xl font-bold text-gray-900 mb-2">{children}</h3>,
                            p: ({children}) => <p className="mb-4 text-gray-800">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-800">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-800">{children}</ol>,
                            li: ({children}) => <li className="mb-1">{children}</li>,
                            strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                            em: ({children}) => <em className="italic text-gray-800">{children}</em>,
                            code: ({children, className }) => {
                              if (className) {
                                // Code block
                                return (
                                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                                    <code className={className}>{children as string}</code>
                                  </pre>
                                );
                              } else {
                                // Inline code
                                return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
                              }
                            },
                            blockquote: ({children}) => <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-gray-700 mb-4">{children}</blockquote>,
                            a: ({children, href}) => <a href={href} className="text-emerald-600 hover:text-emerald-700 underline">{children}</a>,
                            }}
                          >
                            {selectedNote.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to Emerald Notes</h2>
              <p>Select a note from the sidebar or create a new one to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
