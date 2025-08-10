import { NextRequest, NextResponse } from 'next/server';
import { tagOperations, noteOperations } from '@/lib/database';

export async function GET() {
  try {
    // Get tags from the tags table
    const tagsFromTable = tagOperations.getAll.all();
    
    // Get all notes to extract tags from the tags field
    const notes = noteOperations.getAll.all();
    
    // Extract unique tags from notes
    const tagsFromNotes = new Set<string>();
    notes.forEach((note: any) => {
      if (note.tags) {
        const tagList = note.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        tagList.forEach((tag: string) => tagsFromNotes.add(tag));
      }
    });
    
    // Create a map of existing tags from the table
    const existingTags = new Map(tagsFromTable.map((tag: any) => [tag.name, tag]));
    
    // Combine tags from table and notes
    const allTags = [...tagsFromTable];
    
    // Add tags from notes that don't exist in the table
    tagsFromNotes.forEach(tagName => {
      if (!existingTags.has(tagName)) {
        allTags.push({
          id: null,
          name: tagName,
          color: '#3B82F6'
        });
      }
    });
    
    // Add count for each tag
    const tagsWithCount = allTags.map((tag: any) => {
      const count = notes.filter((note: any) => {
        if (!note.tags) return false;
        const tagList = note.tags.split(',').map((t: string) => t.trim());
        return tagList.includes(tag.name);
      }).length;
      
      return {
        ...tag,
        count
      };
    });
    
    return NextResponse.json(tagsWithCount);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color = '#3B82F6' } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const result = tagOperations.create.run(name.trim(), color);
    return NextResponse.json({ id: result.lastInsertRowid, name: name.trim(), color });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
