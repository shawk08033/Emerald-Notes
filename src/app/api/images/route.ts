import { NextRequest, NextResponse } from 'next/server';
import db, { imageOperations } from '@/lib/database';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const { filename, mime, dataBase64 } = await request.json();
      if (!mime || !dataBase64) {
        return NextResponse.json({ error: 'Missing mime or data' }, { status: 400 });
      }
      // Store as Node Buffer (better-sqlite3 expects Buffer)
      const buffer = Buffer.from(dataBase64, 'base64');
      const result = imageOperations.create.run(filename || null, mime, buffer);
      return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = imageOperations.create.run(file.name, file.type || 'application/octet-stream', buffer);
      return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
    }
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
  } catch (e) {
    console.error('Image upload failed', e);
    return NextResponse.json({ error: 'Upload failed', detail: String(e) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const row = imageOperations.getById.get(parseInt(id)) as unknown as { data: Buffer; mime: string; filename?: string } | undefined;
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new Response(row.data, {
      status: 200,
      headers: {
        'Content-Type': row.mime,
        'Content-Disposition': `inline; filename="${row.filename || 'image'}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error('Image fetch failed', e);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    imageOperations.delete.run(parseInt(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Image delete failed', e);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}


