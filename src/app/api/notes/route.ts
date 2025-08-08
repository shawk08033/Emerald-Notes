import { NextRequest, NextResponse } from 'next/server';
import { noteOperations, folderOperations } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folder_id');
    const noFolder = searchParams.get('no_folder');
    
    console.log('API - folderId:', folderId);
    console.log('API - noFolder:', noFolder);
    
    let notes;
    if (folderId) {
      notes = folderOperations.getNotesInFolder.all(parseInt(folderId));
      console.log('API - Filtering by folder ID:', folderId);
    } else if (noFolder === 'true') {
      // Get notes with no folder (folder_id is null)
      const allNotes = noteOperations.getAll.all();
      console.log('API - All notes:', allNotes);
      notes = allNotes.filter((note: any) => note.folder_id === null);
      console.log('API - Notes with no folder:', notes);
    } else {
      notes = noteOperations.getAll.all();
      console.log('API - Getting all notes');
    }
    
    console.log('API - Returning notes:', notes);
    return NextResponse.json(notes);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received POST request body:', body);
    
    const { title, content, tags } = body;
    
    if (!title) {
      console.log('Missing title:', { title, content });
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const result = noteOperations.create.run(title, content || '', tags || '', null);
    const note = noteOperations.getById.get(result.lastInsertRowid);
    
    console.log('Created note:', note);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/notes:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
