'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Sparkles, MessageSquare, 
  Zap, Brain, LogOut, ChevronDown, Wand2,
  PanelLeftClose, PanelLeft, ArrowUp, Paperclip, 
  FileText, Image as ImageIcon, X, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Model = 'auto' | 'gemini' | 'deepseek' | 'grok';

interface AttachedFile {
  name: string;
  type: string;
  size: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: AttachedFile[];
  usedModel?: string;
}

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'What can I help you with today? You can attach code files, syllabus PDFs, or textbook photos.',
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model>('auto');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const modelDetails = {
    auto: { 
      name: 'Auto Router', 
      desc: 'Dynamic classifier (Speed, Code, Reasoning)', 
      badge: 'Smart',
      icon: Wand2 
    },
    gemini: { 
      name: 'Gemini 1.5 Pro', 
      desc: 'Multimodal research, synthesis & academics', 
      badge: 'Google',
      icon: Sparkles 
    },
    deepseek: { 
      name: 'DeepSeek R1', 
      desc: 'Mathematical rigor & algorithmic code', 
      badge: 'Reasoning',
      icon: Brain 
    },
    grok: { 
      name: 'Grok 2', 
      desc: 'Direct, unfiltered & real-time insights', 
      badge: 'xAI',
      icon: Zap 
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: AttachedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      type: f.type.startsWith('image/') ? 'image' : 'doc',
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`
    }));

    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const detectBestModel = (query: string, hasFiles: boolean): 'gemini' | 'deepseek' | 'grok' => {
    if (hasFiles) return 'gemini';
    const q = query.toLowerCase();
    const codeMath = ['code', 'python', 'java', 'c++', 'bug', 'function', 'sql', 'solve', 'calculate', 'matrix', 'integral'];
    const concise = ['summarize', 'brief', 'short', 'explain fast', 'quick'];

    if (codeMath.some((k) => q.includes(k))) return 'deepseek';
    if (concise.some((k) => q.includes(k))) return 'grok';
    return 'gemini';
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || loading) return;

    const userText = input.trim();
    const userFiles = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setMessages((prev) => [...prev, { role: 'user', content: userText, files: userFiles }]);
    setLoading(true);

    const targetModel = selectedModel === 'auto' ? detectBestModel(userText, userFiles.length > 0) : selectedModel;
    const modelMeta = modelDetails[targetModel];

    setTimeout(() => {
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: userFiles.length > 0
            ? `Analyzed **${userFiles.length} file(s)** and query context.\n\nReady to hook up Gemini Multimodal API.`
            : `Processed "${userText}".\n\nReady for model execution.`,
          usedModel: selectedModel === 'auto' ? `Auto: ${modelMeta.name}` : modelMeta.name
        }
      ]);
      setLoading(false);
    }, 900);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const ActiveIcon = modelDetails[selectedModel].icon;

  return (
    <div className="flex h-screen w-full bg-[#0e0e11] text-[#ececed] font-sans antialiased selection:bg-zinc-700 selection:text-white">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 border-r border-zinc-800/80 bg-[#131316] flex flex-col justify-between overflow-hidden`}>
        <div className="p-3 flex flex-col gap-3 min-w-[16rem]">
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="font-semibold text-sm tracking-wide text-zinc-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              CampusAI
            </span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <button 
  onClick={() => {
    setMessages([{ role: 'assistant', content: 'What can I help you with today? You can attach code files, syllabus PDFs, or textbook photos.' }]);
    setAttachedFiles([]);
    setInput('');
  }}
  className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition cursor-pointer shadow-sm"
>
  <Plus className="w-3.5 h-3.5 text-zinc-400" />
  <span>New Chat</span>
</button>
          <div className="mt-3 flex flex-col gap-0.5">
            <div className="text-[11px] font-medium text-zinc-400 px-2 py-1">Recent</div>
            <button className="flex items-center gap-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800/60 px-2.5 py-2 rounded-lg group transition cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-300" />
              <span className="truncate">Computer Networks Subnetting</span>
            </button>
            <button className="flex items-center gap-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800/60 px-2.5 py-2 rounded-lg group transition cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-300" />
              <span className="truncate">Quick Sort Algorithm Logic</span>
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-zinc-800/60 min-w-[16rem]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 w-full px-2 py-2 rounded-lg hover:bg-zinc-800/50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-full relative bg-[#0e0e11]">
        <header className="h-14 border-b border-zinc-800/60 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer mr-1"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-[#17171c] hover:bg-[#1f1f26] border border-zinc-700 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer"
              >
                <ActiveIcon className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-zinc-200">{modelDetails[selectedModel].name}</span>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-9 left-0 w-64 bg-[#18181d] border border-zinc-700/80 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 z-50">
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
                        className={`flex items-start gap-2.5 p-2 rounded-lg transition text-left cursor-pointer ${
                          isSelected ? 'bg-zinc-800/90 text-white' : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 mt-0.5 text-zinc-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-200">{item.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-700/60 text-zinc-300">{item.badge}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-3xl w-full mx-auto">
          {messages.map((msg, index) => (
            <div key={index} className="space-y-2">
              {msg.role === 'user' ? (
                <div className="flex flex-col items-end gap-1.5">
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {msg.files.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1.5 bg-[#1b1b22] border border-zinc-700/70 text-zinc-300 text-xs px-2.5 py-1 rounded-lg">
                          {f.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> : <FileText className="w-3.5 h-3.5 text-amber-400" />}
                          <span className="max-w-[120px] truncate">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.content && (
                    <div className="max-w-[80%] bg-[#212127] text-zinc-100 px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-1">
                  {msg.usedModel && (
                    <span className="text-[10px] text-zinc-400 font-mono tracking-tight flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3 text-zinc-400" />
                      {msg.usedModel}
                    </span>
                  )}
                  <div className="max-w-full text-zinc-200 text-[14px] leading-relaxed whitespace-pre-wrap pr-4">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Gemini/Grok High-End Multimodal Input Card */}
        <div className="p-4 bg-transparent max-w-3xl w-full mx-auto">
          <div className="bg-[#17171c] border border-zinc-700 focus-within:border-zinc-500 rounded-2xl p-2.5 transition-all shadow-xl flex flex-col gap-2">
            
            {/* Active Attached Files Preview Bar */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1 pt-1">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#22222a] border border-zinc-700 text-zinc-200 text-xs pl-2.5 pr-1.5 py-1 rounded-lg">
                    {file.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> : <FileText className="w-3.5 h-3.5 text-amber-400" />}
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button onClick={() => removeFile(idx)} className="p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Expanding Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={selectedModel === 'auto' ? 'Ask anything or upload study material...' : `Message ${modelDetails[selectedModel].name}...`}
              className="w-full bg-transparent px-2 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none resize-none min-h-[24px] max-h-[180px] leading-relaxed"
            />

            {/* Bottom Controls (File Attachment + Send Button) */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.py,.js,.ts,.cpp,.c"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 hover:bg-[#23232b] rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer flex items-center gap-1.5 text-xs"
                  title="Attach images or documents"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && attachedFiles.length === 0)}
                className="h-8 w-8 rounded-xl bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-900 disabled:text-zinc-500 flex items-center justify-center transition cursor-pointer flex-shrink-0"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-center text-zinc-400 mt-2">
            CampusAI can make mistakes. Verify critical academic formulas.
          </p>
        </div>
      </main>
    </div>
  );
}