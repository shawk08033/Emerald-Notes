import { NextRequest, NextResponse } from 'next/server';
import { folderOperations } from '@/lib/database';

export async function GET() {
  try {
    const folders = folderOperations.getAll.all();
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, parent_id, icon } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const result = folderOperations.create.run(name, parent_id || null, icon || null);
    const folder = folderOperations.getById.get(result.lastInsertRowid);
    
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/folders:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
} 