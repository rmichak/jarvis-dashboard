import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Helper to check auth (session or API key)
async function checkAuth(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  const internalKey = process.env.JWT_SECRET;
  if (apiKey && apiKey === internalKey) return true;
  return await getSession();
}

// GET - Get notes
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await query('SELECT * FROM notes WHERE id = 1');
    return NextResponse.json(result.rows[0] || { content: '' });
  } catch (error) {
    console.error('Notes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// PUT - Update notes
export async function PUT(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { content } = await request.json();
    
    await query(
      'UPDATE notes SET content = $1, updated_at = NOW() WHERE id = 1',
      [content]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notes PUT error:', error);
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
  }
}
