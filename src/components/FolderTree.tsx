'use client';

import { useState, useEffect } from 'react';

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

interface FolderTreeProps {
  selectedFolderId: number | 'no-folder' | null;
  onFolderSelect: (folderId: number | 'no-folder' | null) => void;
  onNoteDrop?: (noteId: number, folderId: number | null) => void;
  highlightedFolderId?: number | null;
}

type SortMethod = 'name' | 'created_at' | 'updated_at';

export default function FolderTree({ selectedFolderId, onFolderSelect, onNoteDrop, highlightedFolderId }: FolderTreeProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [sortMethod, setSortMethod] = useState<SortMethod>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: null
        }),
      });

      if (response.ok) {
        const newFolder = await response.json();
        setFolders(prev => [...prev, newFolder]);
        setNewFolderName('');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const deleteFolder = async (folderId: number) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFolders(prev => prev.filter(f => f.id !== folderId));
        if (selectedFolderId === folderId) {
          onFolderSelect(null);
        }
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const sortFolders = (foldersToSort: Folder[]): Folder[] => {
    return [...foldersToSort].sort((a, b) => {
      let comparison = 0;

      switch (sortMethod) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
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

  const renderFolder = (folder: Folder, level: number = 0) => {
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isHighlighted = highlightedFolderId === folder.id;

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.add('bg-emerald-50', 'border-emerald-200', 'border-2');
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.currentTarget.classList.remove('bg-emerald-50', 'border-emerald-200', 'border-2');
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove('bg-emerald-50', 'border-emerald-200', 'border-2');
      
      const noteId = parseInt(e.dataTransfer.getData('text/plain'));
      if (!isNaN(noteId) && onNoteDrop) {
        onNoteDrop(noteId, folder.id);
      }
    };

    return (
      <div key={folder.id} className="w-full">
        <div
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
            isSelected
              ? 'bg-emerald-100 border-emerald-300 border'
              : isHighlighted
              ? 'bg-blue-25 border-blue-100 border'
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onFolderSelect(isSelected ? null : folder.id)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-gray-600">📁</span>
            <span className="text-sm font-medium text-gray-900 truncate">
              {folder.name}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteFolder(folder.id);
            }}
            className="text-red-600 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
        {childFolders.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  const sortedFolders = sortFolders(folders);
  const rootFolders = sortedFolders.filter(f => f.parent_id === null);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Folders</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <select
              value={sortMethod}
              onChange={(e) => setSortMethod(e.target.value as SortMethod)}
              className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:border-emerald-500 text-gray-700"
            >
              <option value="name">Name</option>
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
          <button
            onClick={() => setIsCreating(true)}
            className="text-emerald-600 hover:text-emerald-700 text-sm"
          >
            + New
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              placeholder="Folder name..."
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-500"
              autoFocus
            />
            <button
              onClick={createFolder}
              className="text-emerald-600 hover:text-emerald-700 text-sm"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewFolderName('');
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="group">
        {/* No folder option */}
        <div
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
            selectedFolderId === 'no-folder'
              ? 'bg-emerald-100 border-emerald-300 border'
              : highlightedFolderId === null
              ? 'bg-blue-25 border-blue-100 border'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onFolderSelect(selectedFolderId === 'no-folder' ? null : 'no-folder')}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-emerald-50', 'border-emerald-200', 'border-2');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-emerald-50', 'border-emerald-200', 'border-2');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-emerald-50', 'border-emerald-200', 'border-2');
            
            const noteId = parseInt(e.dataTransfer.getData('text/plain'));
            if (!isNaN(noteId) && onNoteDrop) {
              onNoteDrop(noteId, null);
            }
          }}
        >
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-gray-600">📄</span>
            <span className="text-sm font-medium text-gray-900 truncate">
              No folder
            </span>
          </div>
        </div>
        
        {rootFolders.map(folder => renderFolder(folder))}
      </div>
    </div>
  );
} 