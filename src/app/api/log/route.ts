import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Get action log
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await getSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const result = await query(
      'SELECT * FROM action_log ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Log GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 });
  }
}

// POST - Add log entry (internal API)
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const internalKey = process.env.JWT_SECRET;
    
    const isAuthenticated = await getSession();
    if (apiKey !== internalKey && !isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { action, details } = await request.json();
    
    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }
    
    const result = await query(
      'INSERT INTO action_log (action, details) VALUES ($1, $2) RETURNING *',
      [action, details]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Log POST error:', error);
    return NextResponse.json({ error: 'Failed to add log entry' }, { status: 500 });
  }
}
