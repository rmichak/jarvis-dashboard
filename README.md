# Jarvis Dashboard

A real-time mission control dashboard for AI assistants running on [Moltbot](https://github.com/moltbot/moltbot). Track tasks, monitor activity, and communicate with your AI through a beautiful dark-themed interface.

![Status: Active](https://img.shields.io/badge/status-active-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

## Features

### 🎯 Real-Time Status Monitoring
- **Active/Idle indicator** — See when your AI is working vs. waiting
- **Current task display** — Know exactly what's being worked on
- **Last activity timestamp** — Track engagement at a glance

### 📋 Kanban Task Board
- **To Do** — Queue up tasks for your AI
- **In Progress** — See active work in real-time
- **Done** — Completed task history
- **Archived** — Keep things tidy

### 📜 Action Log
- Chronological activity feed
- Automatic logging of completed tasks
- Custom log entries for important events

### 📝 Notes for AI
- Leave quick notes/tasks for your AI to pick up on heartbeats
- Persistent notepad that survives sessions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Jarvis Dashboard                        │
│                    (Next.js + React)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │ Status  │  │ Kanban  │  │  Logs   │  │     Notes       │ │
│  │ Widget  │  │  Board  │  │  Feed   │  │   (for AI)      │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
│       │            │            │                │          │
│       └────────────┴─────┬──────┴────────────────┘          │
│                          │                                   │
│                    REST API Layer                            │
│              (Session + API Key Auth)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │ PostgreSQL  │
                    │  Database   │
                    └─────────────┘
```

## API Endpoints

All endpoints support both session auth (browser) and API key auth (for AI/scripts).

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get current status (public) |
| `/api/status` | POST | Update status (requires auth) |
| `/api/tasks` | GET | List all tasks |
| `/api/tasks` | POST | Create task |
| `/api/tasks` | PUT | Update task |
| `/api/tasks` | DELETE | Delete task |
| `/api/log` | GET | Get action log |
| `/api/log` | POST | Add log entry |
| `/api/notes` | GET | Get notes |
| `/api/notes` | PUT | Update notes |

### Authentication

**Browser:** JWT session cookie (set via `/api/auth`)

**API Key:** Pass `x-api-key` header with `JWT_SECRET` value

```bash
curl -X POST http://localhost:3000/api/status \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_JWT_SECRET" \
  -d '{"is_active": true, "current_task": "Working on something"}'
```

## Integration with Moltbot

The dashboard is designed to integrate seamlessly with Moltbot AI assistants. Use the helper script for easy task management:

### Task Management Script

```bash
# Start a task (creates Kanban entry + sets Active status)
TASK_ID=$(dashboard-task.sh start "Task description")

# Complete a task (moves to Done + logs + sets Idle)
dashboard-task.sh done $TASK_ID

# Add to action log
dashboard-task.sh log "Action" "Optional details"
```

### Workflow Integration

Add to your AI's instructions:

```markdown
## Task Tracking (MANDATORY)

Every task must be tracked on the Kanban:
1. START: `TASK_ID=$(dashboard-task.sh start "Task title")`
2. WORK: Dashboard shows Active + task in "In Progress"  
3. FINISH: `dashboard-task.sh done $TASK_ID`
```

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rmichak/jarvis-dashboard.git
cd jarvis-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

Required environment variables:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/jarvis_dashboard
JWT_SECRET=your-secure-secret-key
PASSWORD_HASH=bcrypt-hash-of-your-password
```

4. Initialize the database:
```bash
# Create tables (run the SQL from schema below)
psql $DATABASE_URL < schema.sql
```

5. Build and run:
```bash
npm run build
npm start
```

### Database Schema

```sql
-- Status table (single row)
CREATE TABLE status (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT false,
  current_task TEXT,
  last_activity TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO status (id) VALUES (1);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Action log table
CREATE TABLE action_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notes table (single row)
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  content TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO notes (id, content) VALUES (1, '');
```

### Production Deployment with PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'jarvis-dashboard',
    script: 'npm',
    args: 'start -- -H 0.0.0.0 -p 3000',
    cwd: '/path/to/dashboard',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://...',
      PASSWORD_HASH: '...',
      JWT_SECRET: '...'
    }
  }]
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with `pg` driver
- **Auth:** JWT sessions + API key support
- **Process Manager:** PM2 (production)

## Screenshots

*Coming soon*

## License

MIT

## Author

Built for [Jarvis AI Assistant](https://github.com/rmichak) by Randy Michak

---

*"I am Jarvis. I manage things."* 🔵
