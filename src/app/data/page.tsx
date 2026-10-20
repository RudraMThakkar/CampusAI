'use client';

import React, { useState } from 'react';
import { Lock, Save, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminDataPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password verify and load data
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/data', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password galat hai!');
      }

      setContent(data.content);
      setIsAuthenticated(true);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Save updated content
  const handleSave = async () => {
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Update failed!');
      }

      setStatusMsg({ type: 'success', text: 'Data successfully save ho gaya! AI ab isi naye data se answer dega.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      {!isAuthenticated ? (
        // Password Screen
        <div className="bg-slate-800 border border-slate-700 p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber-500/20 text-amber-400 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-center text-white">KD Campus AI Portal</h2>
          <p className="text-xs text-slate-400 text-center mt-1 mb-6">
            College Knowledge Base edit karne ke liye admin password daalein.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter Admin Password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                required
              />
            </div>

            {statusMsg && (
              <div className={`text-xs p-3 rounded-lg flex items-center gap-2 ${statusMsg.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Verify & Edit Data</span>
            </button>
          </form>
        </div>
      ) : (
        // Editor Screen
        <div className="w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col h-[85vh]">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>College Knowledge Base Editor</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">Live (college_data.txt)</span>
              </h2>
              <p className="text-xs text-slate-400">Yahan jo bhi edit karke save karoge, AI usi information ke hisab se students ko answer dega.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/chat" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-xl transition">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Chat</span>
              </Link>

              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {statusMsg && (
            <div className={`my-3 text-xs p-3 rounded-lg flex items-center gap-2 ${statusMsg.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex-1 mt-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste college information, guidelines, seats, and rules here..."
              className="w-full h-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl p-4 text-xs sm:text-sm font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}