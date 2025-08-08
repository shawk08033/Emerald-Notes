import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';

export async function POST() {
  try {
    initDatabase();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
