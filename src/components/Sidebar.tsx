'use client';

import { useState } from 'react';
import FolderTree from './FolderTree';
import TagTree from './TagTree';

interface SidebarProps {
  selectedFolderId: number | 'no-folder' | null;
  selectedTag: string | null;
  onFolderSelect: (folderId: number | 'no-folder' | null) => void;
  onTagSelect: (tag: string | null) => void;
  onCreateNote: () => void;
}

export default function Sidebar({ 
  selectedFolderId, 
  selectedTag, 
  onFolderSelect, 
  onTagSelect,
  onCreateNote
}: SidebarProps) {
  const [view, setView] = useState<'folders' | 'tags'>('folders');

  const handleFolderSelect = (folderId: number | 'no-folder' | null) => {
    onFolderSelect(folderId);
    onTagSelect(null); // Clear tag selection when folder is selected
  };

  const handleTagSelect = (tag: string | null) => {
    onTagSelect(tag);
    onFolderSelect(null); // Clear folder selection when tag is selected
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Emerald Notes</h1>
        <button
          onClick={onCreateNote}
          className="mt-3 w-full bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
        >
          + New Note
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setView('folders')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            view === 'folders'
              ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          📁 Folders
        </button>
        <button
          onClick={() => setView('tags')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            view === 'tags'
              ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          🏷️ Tags
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'folders' ? (
          <FolderTree
            selectedFolderId={selectedFolderId}
            onFolderSelect={handleFolderSelect}
          />
        ) : (
          <TagTree
            selectedTag={selectedTag}
            onTagSelect={handleTagSelect}
          />
        )}
      </div>
    </div>
  );
}
