import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function checkAuth(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  const internalKey = process.env.JWT_SECRET;
  if (apiKey && apiKey === internalKey) return true;
  return await getSession();
}

// GET /api/artifacts - List recent artifacts
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await query(
      'SELECT * FROM artifacts ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Artifacts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch artifacts' }, { status: 500 });
  }
}

// POST /api/artifacts - Create a new artifact
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, artifact_type, url, drive_id, course, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO artifacts (title, artifact_type, url, drive_id, course, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, artifact_type || 'document', url, drive_id, course, description]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Artifacts POST error:', error);
    return NextResponse.json({ error: 'Failed to create artifact' }, { status: 500 });
  }
}

// DELETE /api/artifacts?id=X - Delete an artifact
export async function DELETE(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await query('DELETE FROM artifacts WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Artifacts DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete artifact' }, { status: 500 });
  }
}
