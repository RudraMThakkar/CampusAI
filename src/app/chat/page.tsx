'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Plus, Sparkles, MessageSquare, 
  Zap, Brain, LogOut, ChevronDown, Wand2,
  PanelLeftClose, PanelLeft, ArrowUp, 
  FileText, Image as ImageIcon, X, Loader2,
  GraduationCap, HelpCircle,
  Languages, Copy, Check, Share2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ModeType = 'auto' | 'gemini' | 'deepseek' | 'grok' | 'admission_kd' | 'student_assistant';
type Language = 'en' | 'gu' | 'hi';

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

interface ConversationItem {
  id: string;
  title: string;
  mode: string;
  created_at: string;
}

export default function ChatDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [selectedMode, setSelectedMode] = useState<ModeType>('auto');
  const [lang, setLang] = useState<Language>('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Welcome to CampusAI! Ask academic questions, explore KD Polytechnic Patan admissions, or access GTU student services.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sharedCopied, setSharedCopied] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const langNames: Record<Language, { label: string; native: string }> = {
    en: { label: 'English', native: 'EN' },
    gu: { label: 'ગુજરાતી', native: 'ગુજ' },
    hi: { label: 'हिंदी', native: 'हिं' }
  };

  const modeDetails: Record<ModeType, { name: string; desc: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
    auto: { name: 'Auto Router', desc: 'Dynamic model allocation', badge: 'Smart', icon: Wand2 },
    gemini: { name: 'Gemini 2.0 Flash', desc: 'Ultra-fast multimodal Google engine', badge: 'Google', icon: Sparkles },
    deepseek: { name: 'OX Alpha / Code', desc: 'Advanced code & reasoning via OpenRouter', badge: 'OpenRouter', icon: Brain },
    grok: { name: 'Grok Fast', desc: 'High-speed answers', badge: 'xAI', icon: Zap },
    admission_kd: { name: 'K.D. Polytechnic Admission', desc: 'ACPDC admission & CE branch', badge: 'Patan', icon: GraduationCap },
    student_assistant: { name: 'AI Student Services', desc: 'Scholarship & GTU exam portal', badge: 'Services', icon: HelpCircle }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          fetchConversations(session.user.id);
        }
      } catch (e) {
        console.error('Session retrieval error:', e);
      }
    };
    initAuth();
  }, []);

  const fetchConversations = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, mode, created_at')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setConversations(data);
      }
    } catch (err) {
      console.warn('Failed to load conversations from Supabase:', err);
    }
  };

  const loadConversationMessages = async (convoId: string, convoMode?: string) => {
    try {
      setActiveConversationId(convoId);
      if (convoMode && convoMode in modeDetails) {
        setSelectedMode(convoMode as ModeType);
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id, role, content, used_model')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setMessages(
          data.map((m: any) => ({
            role: m.role,
            content: m.content,
            usedModel: m.used_model,
          }))
        );
      }
    } catch (err) {
      console.warn('Failed to load messages:', err);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      { 
        role: 'assistant', 
        content: 'What can I help you with today? You can ask code doubts, campus queries, or syllabus details.' 
      }
    ]);
    setAttachedFiles([]);
    setInput('');
  };

  const copyMessageContent = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleShareChat = () => {
    if (!activeConversationId) {
      navigator.clipboard.writeText(window.location.href);
    } else {
      const shareUrl = `${window.location.origin}/chat?convoId=${activeConversationId}`;
      navigator.clipboard.writeText(shareUrl);
    }
    setSharedCopied(true);
    setTimeout(() => setSharedCopied(false), 2000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) setIsLangDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToMessage = (index: number) => {
    const target = messageRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleModeSwitch = (mode: ModeType) => {
    setSelectedMode(mode);
    setIsDropdownOpen(false);
  };

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

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if ((!textToSend && attachedFiles.length === 0) || loading) return;

    const userFiles = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const newMessages: Message[] = [...messages, { role: 'user', content: textToSend, files: userFiles }];
    setMessages(newMessages);
    setLoading(true);

    try {
      let currentConvoId = activeConversationId;

      if (!currentConvoId && userId) {
        const titleSnippet = textToSend.slice(0, 28) || 'New Query';
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert([{ user_id: userId, title: titleSnippet, mode: selectedMode }])
          .select()
          .single();

        if (newConvo?.id) {
          currentConvoId = newConvo.id;
          setActiveConversationId(currentConvoId);
          fetchConversations(userId);
        }
      }

      if (currentConvoId) {
        await supabase
          .from('messages')
          .insert([{ conversation_id: currentConvoId, role: 'user', content: textToSend }]);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          mode: selectedMode,
          language: lang,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const usedModelTitle = data.usedModel || `${modeDetails[selectedMode].name}`;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          usedModel: usedModelTitle,
        },
      ]);

      if (currentConvoId) {
        await supabase
          .from('messages')
          .insert([{ conversation_id: currentConvoId, role: 'assistant', content: data.reply, used_model: usedModelTitle }]);
      }

    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Connection Error: ${err.message}`,
          usedModel: 'System Alert',
        },
      ]);
    } finally {
      setLoading(false);
    }
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

  const userPromptIndices = messages
    .map((msg, index) => (msg.role === 'user' ? index : null))
    .filter((val): val is number => val !== null);

  const ActiveIcon = modeDetails[selectedMode].icon;

  return (
    <div className="flex h-screen w-full bg-[#0c0c0e] text-[#ececed] font-sans antialiased">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 border-r border-zinc-800/80 bg-[#111114] flex flex-col justify-between overflow-hidden flex-shrink-0`}>
        <div className="p-3 flex flex-col gap-3 min-w-[16rem] overflow-y-auto">
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
            onClick={startNewChat}
            className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>New Chat</span>
          </button>

          <div className="mt-2 flex flex-col gap-1">
            <div className="text-[11px] font-medium text-zinc-400 px-2 py-1 uppercase tracking-wider">Campus Services</div>
            <button 
              onClick={() => handleModeSwitch('admission_kd')}
              className={`flex items-center gap-2.5 text-left text-xs px-2.5 py-2 rounded-lg transition cursor-pointer ${
                selectedMode === 'admission_kd' ? 'bg-zinc-800 text-white font-medium border border-zinc-700' : 'text-zinc-300 hover:bg-zinc-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="truncate">KD Admission Desk</span>
            </button>

            <button 
              onClick={() => handleModeSwitch('student_assistant')}
              className={`flex items-center gap-2.5 text-left text-xs px-2.5 py-2 rounded-lg transition cursor-pointer ${
                selectedMode === 'student_assistant' ? 'bg-zinc-800 text-white font-medium border border-zinc-700' : 'text-zinc-300 hover:bg-zinc-800/60'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="truncate">AI Student Assistant</span>
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-0.5">
            <div className="text-[11px] font-medium text-zinc-400 px-2 py-1 uppercase tracking-wider">Recent Conversations</div>
            {conversations.length === 0 ? (
              <p className="text-[11px] text-zinc-500 px-2 py-1 italic">No recent chats yet</p>
            ) : (
              conversations.map((convo) => (
                <button 
                  key={convo.id}
                  onClick={() => loadConversationMessages(convo.id, convo.mode)}
                  className={`flex items-center gap-2.5 text-left text-xs px-2.5 py-2 rounded-lg group transition cursor-pointer ${
                    activeConversationId === convo.id ? 'bg-zinc-800 text-white font-medium border border-zinc-700/60' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400 group-hover:text-zinc-300" />
                  <span className="truncate">{convo.title}</span>
                </button>
              ))
            )}
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

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full relative bg-[#0c0c0e] overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-zinc-800/60 px-4 flex items-center justify-between flex-shrink-0">
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
                className="flex items-center gap-2 bg-[#151518] hover:bg-[#1e1e23] border border-zinc-700 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer"
              >
                <ActiveIcon className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-zinc-200">{modeDetails[selectedMode].name}</span>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-9 left-0 w-72 bg-[#17171c] border border-zinc-700/80 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 z-50">
                  {(Object.keys(modeDetails) as ModeType[]).map((m) => {
                    const item = modeDetails[m];
                    const Icon = item.icon;
                    return (
                      <button
                        key={m}
                        onClick={() => handleModeSwitch(m)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg transition text-left cursor-pointer ${
                          selectedMode === m ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200'
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareChat}
              className="flex items-center gap-1.5 bg-[#151518] hover:bg-[#1e1e23] border border-zinc-700 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-200 transition cursor-pointer"
              title="Copy share link"
            >
              {sharedCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{sharedCopied ? 'Link Copied' : 'Share'}</span>
            </button>

            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 bg-[#151518] hover:bg-[#1e1e23] border border-zinc-700 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-200 transition cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                <span>{langNames[lang].label}</span>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute top-9 right-0 w-36 bg-[#17171c] border border-zinc-700/80 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5 z-50">
                  {(['en', 'gu', 'hi'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLang(l);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        lang === l ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                      }`}
                    >
                      <span>{langNames[l].label}</span>
                      <span className="text-[10px] text-zinc-400">{langNames[l].native}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 relative overflow-hidden flex">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-3xl w-full mx-auto scroll-smooth">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                ref={(el) => { messageRefs.current[index] = el; }}
                className="space-y-2 scroll-mt-6 group"
              >
                {msg.role === 'user' ? (
                  <div className="flex flex-col items-end gap-1.5">
                    {msg.files && msg.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        {msg.files.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-1.5 bg-[#18181d] border border-zinc-700/70 text-zinc-300 text-xs px-2.5 py-1 rounded-lg">
                            {f.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> : <FileText className="w-3.5 h-3.5 text-amber-400" />}
                            <span className="max-w-[120px] truncate">{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.content && (
                      <div className="max-w-[80%] bg-[#1f1f26] text-zinc-100 px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border border-zinc-800">
                        {msg.content}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-1">
                    {msg.usedModel && (
                      <span className="text-[10px] text-zinc-400 font-mono tracking-tight flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        {msg.usedModel}
                      </span>
                    )}
                    <div className="max-w-full text-zinc-200 text-[14px] leading-relaxed pr-4 overflow-x-auto w-full">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => (
                            <table className="border-collapse border border-zinc-700 my-3 text-xs w-full text-left" {...props} />
                          ),
                          th: ({node, ...props}) => (
                            <th className="border border-zinc-700 bg-zinc-800/80 px-3 py-2 font-semibold text-zinc-200" {...props} />
                          ),
                          td: ({node, ...props}) => (
                            <td className="border border-zinc-700/70 px-3 py-1.5 text-zinc-300" {...props} />
                          ),
                          p: ({node, ...props}) => <p className="mb-2.5 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2.5 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2.5 space-y-1" {...props} />,
                          code: ({node, ...props}) => (
                            <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs" {...props} />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => copyMessageContent(msg.content, index)}
                        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 rounded-md transition cursor-pointer"
                        title="Copy response text"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>Thinking with {modeDetails[selectedMode].name}...</span>
              </div>
            )}
          </div>

          {userPromptIndices.length > 1 && (
            <div className="hidden md:flex flex-col items-center justify-center gap-2 pr-3 pl-1 py-4 z-20 select-none">
              <div className="bg-[#16161b]/80 backdrop-blur border border-zinc-800/80 rounded-full py-2 px-1 flex flex-col items-center gap-2 shadow-lg">
                {userPromptIndices.map((msgIndex, dotIdx) => (
                  <button
                    key={msgIndex}
                    onClick={() => scrollToMessage(msgIndex)}
                    title={`Jump to query #${dotIdx + 1}`}
                    className="group relative flex items-center justify-center p-1 rounded-full hover:bg-zinc-700/50 transition cursor-pointer"
                  >
                    <span className="h-2 w-2 rounded-full bg-zinc-600 group-hover:bg-indigo-400 transition-all duration-200" />
                    <span className="absolute right-6 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      Prompt #{dotIdx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-transparent max-w-3xl w-full mx-auto flex-shrink-0">
          <div className="bg-[#151519] border border-zinc-700/80 focus-within:border-zinc-500 rounded-2xl p-2.5 transition-all shadow-2xl flex flex-col gap-2">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1 pt-1">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#202028] border border-zinc-700 text-zinc-200 text-xs pl-2.5 pr-1.5 py-1 rounded-lg">
                    {file.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> : <FileText className="w-3.5 h-3.5 text-amber-400" />}
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button onClick={() => removeFile(idx)} className="p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${modeDetails[selectedMode].name}...`}
              className="w-full bg-transparent px-2 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none resize-none min-h-[24px] max-h-[180px] leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 hover:bg-[#202028] rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                  title="Attach verification documents or forms"
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
            CampusAI • K.D. Polytechnic Patan & GTU Multilingual Assistant
          </p>
        </div>
      </main>
    </div>
  );
}