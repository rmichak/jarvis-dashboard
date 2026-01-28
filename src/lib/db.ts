import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS status (
      id SERIAL PRIMARY KEY,
      is_active BOOLEAN DEFAULT false,
      current_task TEXT,
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS action_log (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      content TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insert initial status row if not exists
    INSERT INTO status (id, is_active, current_task)
    SELECT 1, false, NULL
    WHERE NOT EXISTS (SELECT 1 FROM status WHERE id = 1);
    
    -- Insert initial notes row if not exists
    INSERT INTO notes (id, content)
    SELECT 1, 'Add tasks here — Jarvis checks on every heartbeat.'
    WHERE NOT EXISTS (SELECT 1 FROM notes WHERE id = 1);
    
    -- Context tracking table
    CREATE TABLE IF NOT EXISTS context (
      id SERIAL PRIMARY KEY,
      used_tokens INTEGER DEFAULT 0,
      max_tokens INTEGER DEFAULT 200000,
      percentage INTEGER DEFAULT 0,
      compactions INTEGER DEFAULT 0,
      model TEXT,
      session_key TEXT,
      warning_level TEXT DEFAULT 'ok' CHECK (warning_level IN ('ok', 'moderate', 'high', 'critical')),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insert initial context row if not exists
    INSERT INTO context (id, used_tokens, max_tokens, percentage, compactions, warning_level)
    SELECT 1, 0, 200000, 0, 0, 'ok'
    WHERE NOT EXISTS (SELECT 1 FROM context WHERE id = 1);
    
    -- Artifacts table
    CREATE TABLE IF NOT EXISTS artifacts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      artifact_type TEXT DEFAULT 'document' CHECK (artifact_type IN ('pdf', 'document', 'image', 'code', 'other')),
      url TEXT,
      drive_id TEXT,
      course TEXT,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

export default pool;
