import { NextRequest, NextResponse } from 'next/server';
import { noteOperations } from '@/lib/database';

export async function GET() {
  try {
    const notes = noteOperations.getAll.all();
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

    const result = noteOperations.create.run(title, content || '', tags || '');
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
