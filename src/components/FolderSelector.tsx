'use client';

import { useState, useEffect } from 'react';

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

interface FolderSelectorProps {
  selectedFolderId: number | null;
  onFolderChange: (folderId: number | null) => void;
  className?: string;
}

export default function FolderSelector({ selectedFolderId, onFolderChange, className = '' }: FolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFolders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setFolders([]); // Set empty array on error to prevent UI issues
    }
  };

  const getSelectedFolderName = () => {
    if (!selectedFolderId) return 'No folder';
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder ? folder.name : 'No folder';
  };

  const renderFolderOption = (folder: Folder, level: number = 0) => {
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            onFolderChange(folder.id);
            setIsOpen(false);
          }}
        >
          <span className="text-gray-600 mr-2">📁</span>
          {folder.name}
        </div>
        {childFolders.map(child => renderFolderOption(child, level + 1))}
      </div>
    );
  };

  const rootFolders = folders.filter(f => f.parent_id === null);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      >
        <span className="flex items-center">
          <span className="text-gray-600 mr-2">📁</span>
          <span className="text-gray-900">{getSelectedFolderName()}</span>
        </span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div
            className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-700"
            onClick={() => {
              onFolderChange(null);
              setIsOpen(false);
            }}
          >
            <span className="text-gray-600 mr-2">📄</span>
            No folder
          </div>
          {rootFolders.map(folder => renderFolderOption(folder))}
        </div>
      )}
    </div>
  );
} 