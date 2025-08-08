'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DualEditor from '@/components/DualEditor';
import TagInput from '@/components/TagInput';
import FolderTree from '@/components/FolderTree';
import FolderSelector from '@/components/FolderSelector';
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

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<number | 'no-folder' | null>(null);
  const [currentNoteFolderId, setCurrentNoteFolderId] = useState<number | null>(null);
  const [folders, setFolders] = useState<Array<{id: number, name: string, parent_id: number | null}>>([]);
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
      
      const lowlightInstance = createLowlight();
      lowlightInstance.register({ javascript: js, js });
      lowlightInstance.register({ typescript: ts, ts });
      lowlightInstance.register({ python });
      lowlightInstance.register({ java });
      
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
        
        const processNode = (node: any): string => {
          if (typeof node === 'string') {
            return node;
          } else if (node.type === 'element') {
            const className = Array.isArray(node.properties?.className) 
              ? node.properties.className.join(' ') 
              : node.properties?.className || '';
            const content = node.children?.map(processNode).join('') || '';
            return `<span class="token ${className}">${content}</span>`;
          } else if (node.type === 'text') {
            return node.value || '';
          } else {
            return node.value || '';
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

  // Fetch notes when folder selection changes
  useEffect(() => {
    // Only fetch when selectedFolderId changes (not on initial load)
    if (selectedFolderId !== undefined) {
      console.log('useEffect triggered - selectedFolderId changed to:', selectedFolderId);
      fetchNotes();
    }
  }, [selectedFolderId]);

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
      if (selectedFolderId !== null) {
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
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Emerald Notes</h1>
          <button
            onClick={createNewNote}
            className="mt-3 w-full bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
          >
            + New Note
          </button>
        </div>

        {/* Folder Tree */}
        <div className="border-b border-gray-200">
                  <FolderTree
          selectedFolderId={selectedFolderId}
          onFolderSelect={(folderId) => {
            console.log('FolderTree onFolderSelect called with:', folderId);
            setSelectedFolderId(folderId);
          }}
        />
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notes yet. Create your first note!
            </div>
          ) : (
            <div className="p-2">
              {(() => {
                // Sort notes so "no-folder" notes appear first
                const sortedNotes = [...notes].sort((a, b) => {
                  // If a has no folder and b has a folder, a comes first
                  if (a.folder_id === null && b.folder_id !== null) return -1;
                  // If b has no folder and a has a folder, b comes first
                  if (b.folder_id === null && a.folder_id !== null) return 1;
                  // Otherwise, maintain original order
                  return 0;
                });

                console.log('Notes being rendered:', sortedNotes);
                console.log('First note folder_id:', sortedNotes[0]?.folder_id);
                console.log('Second note folder_id:', sortedNotes[1]?.folder_id);

                return sortedNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedNote?.id === note.id
                        ? 'bg-emerald-100 border-emerald-300 border'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedNote(note);
                      setIsEditing(false);
                    }}
                  >
                    <h3 className="font-medium text-gray-900 truncate text-base">
                      {note.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {note.content 
                        ? note.content
                            .replace(/<[^>]*>/g, '') // Remove all HTML tags
                            .replace(/^#+\s+/gm, '') // Remove headers
                            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                            .replace(/\*(.*?)\*/g, '$1') // Remove italic
                            .replace(/`(.*?)`/g, '$1') // Remove inline code
                            .replace(/^- (.*$)/gm, '$1') // Remove list markers
                            .replace(/^(\d+)\. (.*$)/gm, '$2') // Remove numbered list markers
                            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
                            .replace(/\n+/g, ' ') // Replace newlines with spaces
                            .replace(/\s+/g, ' ') // Normalize whitespace
                            .trim()
                            .substring(0, 100) + (note.content.length > 100 ? '...' : '')
                        : 'No content'
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
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
                      {selectedNote.content.includes('<') ? (
                        // Content is HTML from TipTap editor
                        <div 
                          dangerouslySetInnerHTML={{ __html: applySyntaxHighlighting(selectedNote.content) }}
                          className="prose prose-lg max-w-none"
                        />
                      ) : (
                        // Content is markdown
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
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
