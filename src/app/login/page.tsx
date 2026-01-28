'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Hard redirect to dashboard
        window.location.href = '/';
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="bg-[#141d2b] border border-[#1e2a3a] rounded-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="text-4xl">🤖</div>
          <div>
            <h1 className="text-2xl font-bold text-white">Jarvis Dashboard</h1>
            <p className="text-[#94a3b8] text-sm">Enter password to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-[#0a0f1a] border border-[#1e2a3a] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#00d4ff] mb-4"
            autoFocus
          />

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-[#00d4ff] text-[#0a0f1a] font-semibold rounded-lg hover:bg-[#00b8e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
