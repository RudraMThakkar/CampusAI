'use client';

import React, { useState } from 'react';
import { 
  Bot, Send, Sparkles, MessageSquare, Plus, 
  Trash2, Cpu, Zap, Brain, LogOut, ChevronDown 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Model = 'gemini' | 'deepseek' | 'grok';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your CampusAI academic assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model>('gemini');
  const [loading, setLoading] = useState(false);

  const modelDetails = {
    gemini: { name: 'Gemini 1.5 Pro', tag: 'Fast & Versatile', icon: Sparkles, color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
    deepseek: { name: 'DeepSeek R1', tag: 'Reasoning & Code', icon: Brain, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
    grok: { name: 'Grok Beta', tag: 'Direct & Concise', icon: Zap, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    // Mock response simulation for UI test
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `[${modelDetails[selectedModel].name} Response]\nAnalyzing your request: "${userText}". The AI API backend route will process full outputs in the next step!` 
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const ActiveIcon = modelDetails[selectedModel].icon;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between hidden md:flex">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 px-2">
            <Bot className="h-6 w-6 text-indigo-400" />
            <span className="font-bold text-lg tracking-tight text-white">CampusAI</span>
          </div>

          <button className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <div className="mt-2 text-xs font-semibold text-slate-400 px-2 tracking-wider uppercase">
            Recent Chats
          </div>

          <div className="flex flex-col gap-1">
            <button className="flex items-center justify-between text-left text-sm text-slate-300 hover:bg-slate-800/60 px-3 py-2 rounded-lg group transition">
              <span className="truncate flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                DSA Prep & Recursion
              </span>
            </button>
            <button className="flex items-center justify-between text-left text-sm text-slate-300 hover:bg-slate-800/60 px-3 py-2 rounded-lg group transition">
              <span className="truncate flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                DBMS Normalization
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 w-full px-2 py-1.5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Top Navbar with Model Switcher */}
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['gemini', 'deepseek', 'grok'] as Model[]).map((m) => {
                const isSelected = selectedModel === m;
                const Icon = modelDetails[m].icon;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedModel(m)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{modelDetails[m].name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium ${modelDetails[selectedModel].color}`}>
            <ActiveIcon className="w-3.5 h-3.5" />
            <span>{modelDetails[selectedModel].tag}</span>
          </div>
        </header>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <span>{modelDetails[selectedModel].name} is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder={`Ask ${modelDetails[selectedModel].name} anything about code, math, or exams...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 rounded-xl flex items-center justify-center transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}