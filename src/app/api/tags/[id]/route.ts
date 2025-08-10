import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Delete the tag (note_tags junction table will cascade delete)
    const result = db.prepare('DELETE FROM tags WHERE id = ?').run(parseInt(id));
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
