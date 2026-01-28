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

// GET /api/context - Get current context status (public for dashboard display)
export async function GET() {
  try {
    const result = await query('SELECT * FROM context WHERE id = 1');
    if (result.rows.length === 0) {
      return NextResponse.json({
        used_tokens: 0,
        max_tokens: 200000,
        percentage: 0,
        compactions: 0,
        model: null,
        warning_level: 'ok',
        updated_at: new Date().toISOString()
      });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Context GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
  }
}

// PUT /api/context - Update context status (requires API key auth)
export async function PUT(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      used_tokens, 
      max_tokens, 
      percentage, 
      compactions, 
      model, 
      session_key 
    } = body;

    // Calculate warning level based on percentage
    let warning_level = 'ok';
    const pct = percentage || 0;
    if (pct >= 90) {
      warning_level = 'critical';
    } else if (pct >= 75) {
      warning_level = 'high';
    } else if (pct >= 50) {
      warning_level = 'moderate';
    }

    await query(
      `UPDATE context SET 
        used_tokens = COALESCE($1, used_tokens),
        max_tokens = COALESCE($2, max_tokens),
        percentage = COALESCE($3, percentage),
        compactions = COALESCE($4, compactions),
        model = COALESCE($5, model),
        session_key = COALESCE($6, session_key),
        warning_level = $7,
        updated_at = NOW()
      WHERE id = 1`,
      [used_tokens, max_tokens, percentage, compactions, model, session_key, warning_level]
    );

    return NextResponse.json({ success: true, warning_level });
  } catch (error) {
    console.error('Context PUT error:', error);
    return NextResponse.json({ error: 'Failed to update context' }, { status: 500 });
  }
}
