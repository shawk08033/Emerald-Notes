'use client';

import { useState, useEffect } from 'react';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string;
}

export default function TestDB() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notes')
      .then(res => res.json())
      .then(data => {
        setNotes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching notes:', err);
        setLoading(false);
      });
  }, []);

  const createTestNote = async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Note',
          content: 'This is a test note created at ' + new Date().toLocaleString(),
          tags: 'test, demo'
        }),
      });
      
      if (response.ok) {
        const newNote = await response.json();
        setNotes(prev => [newNote, ...prev]);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      
      <button 
        onClick={createTestNote}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
      >
        Create Test Note
      </button>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Notes ({notes.length})</h2>
        {notes.map((note: Note) => (
          <div key={note.id} className="border p-4 rounded">
            <h3 className="font-semibold">{note.title}</h3>
            <p className="text-gray-600 mt-2">{note.content}</p>
            <p className="text-sm text-gray-500 mt-2">
              Created: {new Date(note.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
