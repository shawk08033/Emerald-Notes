'use client';

import { useState, useEffect } from 'react';

interface Tag {
  id: number | null;
  name: string;
  color: string;
  count?: number;
}

interface TagTreeProps {
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

export default function TagTree({ selectedTag, onTagSelect }: TagTreeProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: '#3B82F6'
        }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setTags(prev => [...prev, newTag]);
        setNewTagName('');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const deleteTag = async (tagId: number | null, tagName: string) => {
    // Can't delete tags that don't have an ID (tags from notes)
    if (tagId === null) {
      return;
    }
    
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTags(prev => prev.filter(t => t.id !== tagId));
        if (selectedTag === tagName) {
          onTagSelect(null);
        }
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const renderTag = (tag: Tag) => {
    const isSelected = selectedTag === tag.name;

    return (
      <div
        key={tag.id}
        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-emerald-100 border-emerald-300 border'
            : 'hover:bg-gray-50'
        }`}
        onClick={() => onTagSelect(isSelected ? null : tag.name)}
      >
        <div className="flex items-center space-x-2 flex-1">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <span className="text-sm font-medium text-gray-900 truncate">
            #{tag.name}
          </span>
          {tag.count !== undefined && (
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {tag.count}
            </span>
          )}
        </div>
        {tag.id !== null && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTag(tag.id, tag.name);
            }}
            className="text-red-600 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Tags</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="text-emerald-600 hover:text-emerald-700 text-sm"
        >
          + New
        </button>
      </div>

      {isCreating && (
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createTag()}
              placeholder="Tag name..."
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-emerald-500 text-gray-900 placeholder-gray-500"
              autoFocus
            />
            <button
              onClick={createTag}
              className="text-emerald-600 hover:text-emerald-700 text-sm"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTagName('');
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="group">
        {tags.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No tags yet. Create your first tag!
          </div>
        ) : (
          tags.map(tag => renderTag(tag))
        )}
      </div>
    </div>
  );
}
