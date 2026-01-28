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
  `);
}

export default pool;
