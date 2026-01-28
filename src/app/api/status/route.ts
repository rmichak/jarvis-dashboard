import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Get current status (public for polling)
export async function GET() {
  try {
    const result = await query('SELECT * FROM status WHERE id = 1');
    const status = result.rows[0] || { is_active: false, current_task: null, last_activity: new Date() };
    return NextResponse.json(status);
  } catch (error) {
    console.error('Status GET error:', error);
    return NextResponse.json({ is_active: false, current_task: null, last_activity: new Date() });
  }
}

// POST - Update status (requires internal API key for Jarvis to call)
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const internalKey = process.env.JWT_SECRET; // Reuse JWT secret as internal API key
    
    // Allow internal updates or authenticated users
    const isAuthenticated = await getSession();
    if (apiKey !== internalKey && !isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { is_active, current_task } = await request.json();
    
    await query(
      `UPDATE status SET 
        is_active = COALESCE($1, is_active),
        current_task = $2,
        last_activity = NOW(),
        updated_at = NOW()
      WHERE id = 1`,
      [is_active, current_task]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Status POST error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
