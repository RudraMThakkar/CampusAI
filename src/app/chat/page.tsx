'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, MessageSquare, Plus, 
  Trash2, Zap, Brain, LogOut, ChevronDown, Check, Wand2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Model = 'auto' | 'gemini' | 'deepseek' | 'grok';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  usedModel?: string;
}

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I am your CampusAI academic copilot. Select a model or use Auto Mode to let me choose the best AI for your query!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model>('auto');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const modelDetails = {
    auto: { 
      name: 'Auto Mode', 
      desc: 'Intelligently routes to the best model', 
      tag: 'Smart Routing', 
      icon: Wand2, 
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' 
    },
    gemini: { 
      name: 'Gemini 1.5 Pro', 
      desc: 'Academic analysis & fast explanations', 
      tag: 'Fast & Versatile', 
      icon: Sparkles, 
      color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' 
    },
    deepseek: { 
      name: 'DeepSeek R1', 
      desc: 'Complex math, coding & deep reasoning', 
      tag: 'Reasoning & Code', 
      icon: Brain, 
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' 
    },
    grok: { 
      name: 'Grok Beta', 
      desc: 'Direct, witty & concise insights', 
      tag: 'Direct & Realtime', 
      icon: Zap, 
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' 
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart Model Classifier for Auto Mode
  const detectBestModel = (query: string): 'gemini' | 'deepseek' | 'grok' => {
    const q = query.toLowerCase();
    const codeKeywords = ['code', 'python', 'java', 'c++', 'bug', 'function', 'algorithm', 'sql', 'dsa', 'react', 'api'];
    const mathKeywords = ['solve', 'calculate', 'derivative', 'integral', 'matrix', 'physics', 'math'];
    const conciseKeywords = ['summarize', 'bullet', 'brief', 'short', 'quick', 'define'];

    if (codeKeywords.some(k => q.includes(k)) || mathKeywords.some(k => q.includes(k))) {
      return 'deepseek';
    }
    if (conciseKeywords.some(k => q.includes(k))) {
      return 'grok';
    }
    return 'gemini';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    const targetModel = selectedModel === 'auto' ? detectBestModel(userText) : selectedModel;
    const modelMeta = modelDetails[targetModel];

    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `Analyzed query: "${userText}". Ready for backend API integration!`,
          usedModel: selectedModel === 'auto' ? `Auto-routed to ${modelMeta.name}` : modelMeta.name
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
                DSA Recursion & Trees
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
            className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 w-full px-2 py-1.5 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Top Navbar with Dropdown */}
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/30 backdrop-blur-md relative z-30">
          {/* Dropdown Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer shadow-lg shadow-black/20"
            >
              <div className={`p-1 rounded-lg ${modelDetails[selectedModel].color.split(' ')[2]}`}>
                <ActiveIcon className={`w-4 h-4 ${modelDetails[selectedModel].color.split(' ')[0]}`} />
              </div>
              <span className="text-white font-semibold">{modelDetails[selectedModel].name}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown List */}
            {isDropdownOpen && (
              <div className="absolute top-12 left-0 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                {(['auto', 'gemini', 'deepseek', 'grok'] as Model[]).map((m) => {
                  const item = modelDetails[m];
                  const Icon = item.icon;
                  const isSelected = selectedModel === m;

                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedModel(m);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-start gap-3 p-2.5 rounded-xl transition text-left cursor-pointer ${
                        isSelected ? 'bg-indigo-600/15 border border-indigo-500/30' : 'hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg mt-0.5 ${item.color.split(' ')[2]}`}>
                        <Icon className={`w-4 h-4 ${item.color.split(' ')[0]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{item.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${modelDetails[selectedModel].color}`}>
            <ActiveIcon className="w-3.5 h-3.5" />
            <span>{modelDetails[selectedModel].tag}</span>
          </div>
        </header>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/10'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>

              {msg.usedModel && (
                <span className="text-[10px] text-slate-500 mt-1.5 ml-11 flex items-center gap-1 font-mono">
                  <Wand2 className="w-2.5 h-2.5 text-indigo-400" />
                  {msg.usedModel}
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <span>Routing and computing response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder={
                selectedModel === 'auto'
                  ? 'Ask anything... Auto Mode will pick the right AI for code, math, or exams'
                  : `Ask ${modelDetails[selectedModel].name}...`
              }
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