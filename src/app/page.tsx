'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  created_at: string;
  updated_at: string;
}

interface Status {
  is_active: boolean;
  current_task: string | null;
  last_activity: string;
}

interface ContextStatus {
  used_tokens: number;
  max_tokens: number;
  percentage: number;
  compactions: number;
  model: string | null;
  warning_level: 'ok' | 'moderate' | 'high' | 'critical';
  updated_at: string;
}

interface LogEntry {
  id: number;
  action: string;
  details?: string;
  created_at: string;
}

interface Artifact {
  id: number;
  title: string;
  artifact_type: 'pdf' | 'document' | 'image' | 'code' | 'other';
  url: string | null;
  drive_id: string | null;
  course: string | null;
  description: string | null;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ is_active: false, current_task: null, last_activity: new Date().toISOString() });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [context, setContext] = useState<ContextStatus>({ 
    used_tokens: 0, 
    max_tokens: 200000, 
    percentage: 0, 
    compactions: 0, 
    model: null, 
    warning_level: 'ok',
    updated_at: new Date().toISOString()
  });

  const fetchData = useCallback(async () => {
    try {
      // Fetch status (public)
      const statusRes = await fetch('/api/status');
      if (statusRes.ok) {
        setStatus(await statusRes.json());
      }

      // Fetch tasks
      const tasksRes = await fetch('/api/tasks');
      if (tasksRes.status === 401) {
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }
      if (tasksRes.ok) {
        setTasks(await tasksRes.json());
      }

      // Fetch log
      const logRes = await fetch('/api/log?limit=20');
      if (logRes.ok) {
        setLog(await logRes.json());
      }

      // Fetch notes
      const notesRes = await fetch('/api/notes');
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data.content || '');
      }

      // Fetch context status
      const contextRes = await fetch('/api/context');
      if (contextRes.ok) {
        setContext(await contextRes.json());
      }

      // Fetch artifacts
      const artifactsRes = await fetch('/api/artifacts?limit=10');
      if (artifactsRes.ok) {
        setArtifacts(await artifactsRes.json());
      }

      setLastSync(new Date());
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle }),
    });
    setNewTaskTitle('');
    fetchData();
  };

  const updateTaskStatus = async (id: number, newStatus: string) => {
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
    fetchData();
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const saveNotes = async () => {
    await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: notes }),
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTasksByStatus = (taskStatus: string) => tasks.filter(t => t.status === taskStatus);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-[#e2e8f0]">
      {/* Header */}
      <header className="border-b border-[#1e2a3a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <h1 className="text-xl font-bold text-white">Jarvis Dashboard</h1>
          <span className={`flex items-center gap-1.5 text-sm ${status.is_active ? 'text-green-400' : 'text-[#94a3b8]'}`}>
            <span className={`w-2 h-2 rounded-full ${status.is_active ? 'bg-green-400 animate-pulse' : 'bg-[#94a3b8]'}`}></span>
            {status.is_active ? 'Active' : 'Idle'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#94a3b8] text-sm">
            Last sync: {lastSync.toLocaleTimeString()}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-[#94a3b8] hover:text-white border border-[#1e2a3a] rounded-lg hover:border-[#94a3b8] transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#1e2a3a] p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="text-6xl mb-3">🤖</div>
            <h2 className="text-lg font-semibold text-white">Jarvis</h2>
            <span className={`flex items-center gap-1.5 text-sm ${status.is_active ? 'text-green-400' : 'text-[#94a3b8]'}`}>
              <span className={`w-2 h-2 rounded-full ${status.is_active ? 'bg-green-400' : 'bg-[#94a3b8]'}`}></span>
              {status.is_active ? 'Active' : 'Idle'}
            </span>
          </div>
          
          {status.current_task && (
            <div className="bg-[#141d2b] border border-[#1e2a3a] rounded-lg p-3 mb-4">
              <p className="text-xs text-[#94a3b8] mb-1">Current Task</p>
              <p className="text-sm text-[#00d4ff]">{status.current_task}</p>
            </div>
          )}
          
          <p className="text-sm text-[#94a3b8]">
            {status.is_active ? 'Working on tasks...' : 'Ready for tasks'}
          </p>
          
          <div className="mt-6 pt-6 border-t border-[#1e2a3a]">
            <p className="text-xs text-[#94a3b8] mb-2">Last Activity</p>
            <p className="text-sm">{formatTime(status.last_activity)}</p>
          </div>

          {/* Context Status Widget */}
          <div className="mt-6 pt-6 border-t border-[#1e2a3a]">
            <div className="flex items-center gap-2 mb-3">
              <span>🧠</span>
              <p className="text-xs text-[#94a3b8]">Context Status</p>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className={`font-semibold ${
                  context.warning_level === 'critical' ? 'text-red-400' :
                  context.warning_level === 'high' ? 'text-orange-400' :
                  context.warning_level === 'moderate' ? 'text-yellow-400' :
                  'text-[#00d4ff]'
                }`}>
                  {context.percentage}%
                </span>
                <span className="text-[#94a3b8]">
                  {Math.round(context.used_tokens / 1000)}k / {Math.round(context.max_tokens / 1000)}k
                </span>
              </div>
              <div className="w-full bg-[#1e2a3a] rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    context.warning_level === 'critical' ? 'bg-red-400' :
                    context.warning_level === 'high' ? 'bg-orange-400' :
                    context.warning_level === 'moderate' ? 'bg-yellow-400' :
                    'bg-[#00d4ff]'
                  }`}
                  style={{ width: `${Math.min(context.percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Warning Message */}
            {context.warning_level !== 'ok' && (
              <div className={`text-xs p-2 rounded mt-2 ${
                context.warning_level === 'critical' ? 'bg-red-400/20 text-red-400' :
                context.warning_level === 'high' ? 'bg-orange-400/20 text-orange-400' :
                'bg-yellow-400/20 text-yellow-400'
              }`}>
                {context.warning_level === 'critical' && '⚠️ Context nearly full! Compaction imminent.'}
                {context.warning_level === 'high' && '⚠️ Context at 75%+. Consider wrapping up.'}
                {context.warning_level === 'moderate' && '📊 Context at 50%+.'}
              </div>
            )}

            {/* Compactions Counter */}
            <div className="flex justify-between text-xs mt-3">
              <span className="text-[#94a3b8]">Compactions</span>
              <span className={context.compactions > 0 ? 'text-amber-400' : 'text-[#94a3b8]'}>
                {context.compactions}
              </span>
            </div>

            {/* Model */}
            {context.model && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-[#94a3b8]">Model</span>
                <span className="text-[#00d4ff] truncate max-w-[120px]" title={context.model}>
                  {context.model.split('/').pop()}
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Kanban Board */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {/* To Do */}
            <div className="bg-[#141d2b] border border-[#1e2a3a] rounded-lg">
              <div className="p-4 border-b border-[#1e2a3a] flex items-center gap-2">
                <span>📋</span>
                <h3 className="font-semibold text-white">To Do</h3>
                <span className="text-[#94a3b8] text-sm">({getTasksByStatus('todo').length})</span>
              </div>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {getTasksByStatus('todo').map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} onDelete={deleteTask} formatTime={formatTime} />
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    placeholder="Add task..."
                    className="flex-1 px-3 py-2 bg-[#0a0f1a] border border-[#1e2a3a] rounded text-sm text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#00d4ff]"
                  />
                  <button onClick={addTask} className="px-3 py-2 bg-[#00d4ff] text-[#0a0f1a] rounded font-semibold text-sm hover:bg-[#00b8e6]">+</button>
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-[#141d2b] border border-[#f59e0b]/30 rounded-lg">
              <div className="p-4 border-b border-[#1e2a3a] flex items-center gap-2">
                <span>⚡</span>
                <h3 className="font-semibold text-[#f59e0b]">In Progress</h3>
                <span className="text-[#94a3b8] text-sm">({getTasksByStatus('in_progress').length})</span>
              </div>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {getTasksByStatus('in_progress').map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} onDelete={deleteTask} formatTime={formatTime} accent="amber" />
                ))}
              </div>
            </div>

            {/* Done */}
            <div className="bg-[#141d2b] border border-[#10b981]/30 rounded-lg">
              <div className="p-4 border-b border-[#1e2a3a] flex items-center gap-2">
                <span>✅</span>
                <h3 className="font-semibold text-[#10b981]">Done</h3>
                <span className="text-[#94a3b8] text-sm">({getTasksByStatus('done').length})</span>
              </div>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {getTasksByStatus('done').map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} onDelete={deleteTask} formatTime={formatTime} accent="green" />
                ))}
              </div>
            </div>

            {/* Archived */}
            <div className="bg-[#141d2b] border border-[#1e2a3a] rounded-lg opacity-75">
              <div className="p-4 border-b border-[#1e2a3a] flex items-center gap-2">
                <span>📦</span>
                <h3 className="font-semibold text-[#94a3b8]">Archived</h3>
                <span className="text-[#94a3b8] text-sm">({getTasksByStatus('archived').length})</span>
              </div>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {getTasksByStatus('archived').map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} onDelete={deleteTask} formatTime={formatTime} muted />
                ))}
              </div>
            </div>
          </div>

          {/* Recent Artifacts */}
          <div className="bg-[#141d2b] border border-[#1e2a3a] rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span>📦</span>
                <h3 className="font-semibold text-white">Recent Artifacts</h3>
                <span className="text-[#94a3b8] text-sm">({artifacts.length})</span>
              </div>
              <a 
                href="https://drive.google.com/drive/folders/1r_3xImurq5dK73NGvWyiyh1xQIs-XOeJ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#00d4ff] border border-[#1e2a3a] rounded-lg hover:border-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors"
              >
                <span>📁</span> Google Drive
              </a>
            </div>
            {artifacts.length === 0 ? (
              <p className="text-[#94a3b8] text-sm">No artifacts yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {artifacts.map(artifact => (
                  <div key={artifact.id} className="bg-[#0a0f1a] border border-[#1e2a3a] rounded-lg p-3 hover:border-[#00d4ff] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex-shrink-0">
                          {artifact.artifact_type === 'pdf' ? '📄' :
                           artifact.artifact_type === 'document' ? '📝' :
                           artifact.artifact_type === 'image' ? '🖼️' :
                           artifact.artifact_type === 'code' ? '💻' : '📎'}
                        </span>
                        <div className="min-w-0">
                          {artifact.url ? (
                            <a href={artifact.url} target="_blank" rel="noopener noreferrer"
                               className="text-sm font-medium text-[#00d4ff] hover:underline truncate block">
                              {artifact.title}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-white truncate block">{artifact.title}</span>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {artifact.course && (
                              <span className="text-xs bg-[#1e2a3a] text-[#f59e0b] px-2 py-0.5 rounded">{artifact.course}</span>
                            )}
                            <span className="text-xs text-[#94a3b8]">{formatTime(artifact.created_at)}</span>
                          </div>
                          {artifact.description && (
                            <p className="text-xs text-[#94a3b8] mt-1 line-clamp-1">{artifact.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Notes */}
            <div className="bg-[#141d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <span>📝</span>
                <h3 className="font-semibold text-white">Notes for Jarvis</h3>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Add tasks here — Jarvis checks on every heartbeat."
                className="w-full h-32 px-3 py-2 bg-[#0a0f1a] border border-[#1e2a3a] rounded text-sm text-[#e2e8f0] placeholder-[#94a3b8] focus:outline-none focus:border-[#00d4ff] resize-none"
              />
            </div>

            {/* Action Log */}
            <div className="bg-[#141d2b] border border-[#1e2a3a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <span>📜</span>
                <h3 className="font-semibold text-white">Action Log</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {log.length === 0 ? (
                  <p className="text-[#94a3b8] text-sm">No recent actions</p>
                ) : (
                  log.map(entry => (
                    <div key={entry.id} className="flex gap-3 text-sm">
                      <span className="text-[#00d4ff] whitespace-nowrap">{formatTime(entry.created_at)}</span>
                      <span className="text-[#e2e8f0]">{entry.action}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TaskCard({ 
  task, 
  onStatusChange, 
  onDelete, 
  formatTime,
  accent = 'cyan',
  muted = false 
}: { 
  task: Task; 
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  formatTime: (date: string) => string;
  accent?: 'cyan' | 'amber' | 'green';
  muted?: boolean;
}) {
  const accentColors = {
    cyan: 'border-l-[#00d4ff]',
    amber: 'border-l-[#f59e0b]',
    green: 'border-l-[#10b981]',
  };

  const nextStatus: Record<string, string> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'archived',
    archived: 'todo',
  };

  return (
    <div className={`bg-[#0a0f1a] border border-[#1e2a3a] border-l-4 ${accentColors[accent]} rounded p-3 ${muted ? 'opacity-60' : ''}`}>
      <p className="text-sm text-white mb-1">{task.title}</p>
      <p className="text-xs text-[#94a3b8] mb-2">{formatTime(task.created_at)}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          className="text-xs text-[#00d4ff] hover:underline"
        >
          {task.status === 'archived' ? '↩ Restore' : '→ Move'}
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-xs text-red-400 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
