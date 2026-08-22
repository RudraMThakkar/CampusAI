'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Sparkles, MessageSquare, 
  Zap, Brain, LogOut, ChevronDown, Wand2,
  PanelLeftClose, PanelLeft, ArrowUp, 
  FileText, Image as ImageIcon, X, Loader2,
  GraduationCap, HelpCircle, Building2, BookOpen, Phone, Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ModeType = 'auto' | 'gemini' | 'deepseek' | 'grok' | 'admission_kd' | 'student_assistant';

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
  const [selectedMode, setSelectedMode] = useState<ModeType>('auto');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Welcome to CampusAI. Choose general AI models above or switch to KD Polytechnic Admission & Student Services in the sidebar.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const modeDetails: Record<ModeType, { name: string; desc: string; badge: string; icon: any }> = {
    auto: { 
      name: 'Auto Router', 
      desc: 'Dynamic query classifier (Speed, Code, Reasoning)', 
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
    },
    admission_kd: {
      name: 'K.D. Polytechnic Admission',
      desc: 'Step-by-step admission, Computer Engg, ACPDC & seats',
      badge: 'Patan',
      icon: GraduationCap
    },
    student_assistant: {
      name: 'AI Student Services',
      desc: 'Online form filling, GTU exam portal & study resources',
      badge: 'Services',
      icon: HelpCircle
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

  const handleModeSwitch = (mode: ModeType) => {
    setSelectedMode(mode);
    setIsDropdownOpen(false);

    if (mode === 'admission_kd') {
      setMessages([
        {
          role: 'assistant',
          content: `**Welcome to K.D. Polytechnic Patan Admission Desk**\n\nI can guide you through:\n* **Step-by-Step ACPDC Admission Process** (Registration, Merit Rank, Choice Filling, Token Fee)\n* **Computer Engineering (CE) Department** (Labs, Curriculum, Faculty Overview)\n* **Government Quota Seats & Reservation** (OPEN, SEBC/OBC, SC, ST, EWS, TFW Scheme)\n* **Facilities & Campus Life** (Hostel, Library, Wi-Fi Labs)\n* **Official Contact & Help Center**\n\nWhat would you like to know first?`
        }
      ]);
    } else if (mode === 'student_assistant') {
      setMessages([
        {
          role: 'assistant',
          content: `**CampusAI Student Services Desk**\n\nI can assist with all technical college workflows:\n* **Online Form Filling** (Digital Gujarat Scholarship, ACPDC registration, GTU Exam form)\n* **Document Checklists** (Income certificate, Caste verification, LC, Marksheets)\n* **Resource Finder** (GTU Syllabus, Question Papers, Lab Manuals)\n\nType your query or click a quick action below.`
        }
      ]);
    }
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

  const generateSpecializedResponse = (query: string, mode: ModeType) => {
    const q = query.toLowerCase();

    if (mode === 'admission_kd') {
      if (q.includes('step') || q.includes('process') || q.includes('acpdc') || q.includes('how to get admission')) {
        return `**Step-by-Step Admission Process for K.D. Polytechnic, Patan (ACPDC)**\n\n1. **Online ACPDC Registration**: Visit \`gujdiploma.admissions.nic.in\`, register with 10th marksheet and create login ID.\n2. **Document Verification**: Upload 10th marksheet, LC, Caste/Income certificates for online e-verification.\n3. **Merit List Announcement**: Check your State Merit Rank & Category Rank.\n4. **Choice Filling (Crucial Step)**: Put **"K.D. POLYTECHNIC, PATAN (Govt.) - Computer Engineering"** as your highest priority choice.\n5. **Seat Allotment & Token Fee**: Download seat allotment letter and pay the nominal government token fee online to confirm admission.\n6. **Physical Reporting**: Report to the campus in Patan with original documents for document endorsement.`;
      }
      if (q.includes('computer') || q.includes('ce') || q.includes('faculty') || q.includes('lab')) {
        return `**Computer Engineering Department Overview**\n\n* **Labs & Infrastructure**: High-speed internet connected labs equipped for Python, C/C++, Database systems, Web Development, and Networking.\n* **Faculty**: Qualified Government-appointed lecturers offering dedicated guidance for GTU examinations and diploma projects.\n* **Placement & Pathways**: Direct Second Year Degree (D2D) admission support in top engineering colleges (LDCE, VGEC, GEC) and industrial placement drives.`;
      }
      if (q.includes('seat') || q.includes('quota') || q.includes('tfw')) {
        return `**Government Quota & Seat Matrix**\n\n* **Type**: 100% Government Quota administered by ACPDC Gujarat.\n* **Affiliation**: GTU (Gujarat Technological University) & Approved by AICTE.\n* **Categories**: Open, SEBC/OBC, SC, ST, EWS quota seats.\n* **TFW Scheme**: Tuition Fee Waiver (TFW) supernumerary seats available for high-merit students with family income under prescribed limit.`;
      }
      if (q.includes('contact') || q.includes('address') || q.includes('phone') || q.includes('email')) {
        return `**K.D. Polytechnic Patan Contact Details**\n\n* **Institution**: Kilachand Devchand Polytechnic (KDPC)\n* **Address**: Near Hemchandracharya North Gujarat University (HNGU) Highway, Patan - 384265, Gujarat.\n* **Category**: Government Polytechnic College\n* **Admissions Help**: ACPDC Official Portal & College Admission Desk counter during working hours (10:30 AM to 5:00 PM).`;
      }
      return `**K.D. Polytechnic Patan Admission Assistant**\n\nReceived your inquiry: "${query}"\n\nYou can ask about cut-offs, Computer Engineering seat availability, document lists, or ACPDC registration steps!`;
    }

    if (mode === 'student_assistant') {
      if (q.includes('form') || q.includes('scholarship') || q.includes('digital gujarat')) {
        return `**Online Form Filling Assistance**\n\n* **Digital Gujarat Scholarship**: Requires Income Certificate, Caste Certificate, Bank Passbook (Aadhaar linked), College Fee Receipt, and Bonafide.\n* **GTU Exam Form**: Login to \`student.gtu.ac.in\`, verify pending subjects, pay examination fees, and download receipt.\n* **ACPDC Correction**: Guidance on category changes, income renewal, and grievance submission.`;
      }
      return `**CampusAI Student Support**\n\nHere are step-by-step instructions for: "${query}". Upload any application form screenshot or PDF if you need live error-checking.`;
    }

    return `Processed query: "${query}" via ${modeDetails[mode].name}.`;
  };

  const handleSend = (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if ((!textToSend && attachedFiles.length === 0) || loading) return;

    const userFiles = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setMessages((prev) => [...prev, { role: 'user', content: textToSend, files: userFiles }]);
    setLoading(true);

    setTimeout(() => {
      const reply = generateSpecializedResponse(textToSend, selectedMode);
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: reply,
          usedModel: modeDetails[selectedMode].name
        }
      ]);
      setLoading(false);
    }, 700);
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

  const ActiveIcon = modeDetails[selectedMode].icon;

  return (
    <div className="flex h-screen w-full bg-[#0e0e11] text-[#ececed] font-sans antialiased selection:bg-zinc-700 selection:text-white">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 border-r border-zinc-800/80 bg-[#131316] flex flex-col justify-between overflow-hidden flex-shrink-0`}>
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
              setSelectedMode('auto');
            }}
            className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>New Chat</span>
          </button>

          {/* Specialized Modules Section */}
          <div className="mt-2 flex flex-col gap-1">
            <div className="text-[11px] font-medium text-zinc-400 px-2 py-1 uppercase tracking-wider">Campus Services</div>
            
            <button 
              onClick={() => handleModeSwitch('admission_kd')}
              className={`flex items-center gap-2.5 text-left text-xs px-2.5 py-2 rounded-lg transition cursor-pointer ${
                selectedMode === 'admission_kd' 
                  ? 'bg-zinc-800 text-white font-medium border border-zinc-700' 
                  : 'text-zinc-300 hover:bg-zinc-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="truncate">KD Admission Desk</span>
            </button>

            <button 
              onClick={() => handleModeSwitch('student_assistant')}
              className={`flex items-center gap-2.5 text-left text-xs px-2.5 py-2 rounded-lg transition cursor-pointer ${
                selectedMode === 'student_assistant' 
                  ? 'bg-zinc-800 text-white font-medium border border-zinc-700' 
                  : 'text-zinc-300 hover:bg-zinc-800/60'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="truncate">AI Student Assistant</span>
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-0.5">
            <div className="text-[11px] font-medium text-zinc-400 px-2 py-1 uppercase tracking-wider">Recent</div>
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

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full relative bg-[#0e0e11] overflow-hidden">
        {/* Header with Mode Selector */}
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

            {/* Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-[#17171c] hover:bg-[#1f1f26] border border-zinc-700 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer"
              >
                <ActiveIcon className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-zinc-200">{modeDetails[selectedMode].name}</span>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-9 left-0 w-72 bg-[#18181d] border border-zinc-700/80 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 z-50">
                  {(Object.keys(modeDetails) as ModeType[]).map((m) => {
                    const item = modeDetails[m];
                    const Icon = item.icon;
                    const isSelected = selectedMode === m;

                    return (
                      <button
                        key={m}
                        onClick={() => handleModeSwitch(m)}
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
          {/* Quick Action Suggestion Chips for Specialized Mode */}
          {selectedMode === 'admission_kd' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <button 
                onClick={() => handleSend('Tell me step-by-step ACPDC admission process for KD Polytechnic')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400 mb-1" />
                <div className="font-medium text-zinc-200">ACPDC Process</div>
                <div className="text-[10px] text-zinc-400">Step-by-step steps</div>
              </button>

              <button 
                onClick={() => handleSend('Tell me about Computer Engineering department labs and faculty')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-400 mb-1" />
                <div className="font-medium text-zinc-200">CE Department</div>
                <div className="text-[10px] text-zinc-400">Labs & faculty</div>
              </button>

              <button 
                onClick={() => handleSend('What are the government quota seats, categories and TFW scheme?')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                <div className="font-medium text-zinc-200">Quota & Seats</div>
                <div className="text-[10px] text-zinc-400">Govt & TFW seats</div>
              </button>

              <button 
                onClick={() => handleSend('Give me KD Polytechnic Patan contact details and address')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400 mb-1" />
                <div className="font-medium text-zinc-200">Contact & Info</div>
                <div className="text-[10px] text-zinc-400">Campus address</div>
              </button>
            </div>
          )}

          {selectedMode === 'student_assistant' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <button 
                onClick={() => handleSend('Guide me step-by-step for Digital Gujarat Scholarship online form')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                <div className="font-medium text-zinc-200">Scholarship Forms</div>
                <div className="text-[10px] text-zinc-400">Digital Gujarat portal</div>
              </button>

              <button 
                onClick={() => handleSend('What is the required document checklist for admission and exam forms?')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400 mb-1" />
                <div className="font-medium text-zinc-200">Document Checklist</div>
                <div className="text-[10px] text-zinc-400">Income & Caste verification</div>
              </button>

              <button 
                onClick={() => handleSend('Where can I get GTU diploma computer engineering syllabus and papers?')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400 mb-1" />
                <div className="font-medium text-zinc-200">GTU Resources</div>
                <div className="text-[10px] text-zinc-400">Syllabus & question banks</div>
              </button>
            </div>
          )}

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
              <span>Fetching college info & verifying steps...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-transparent max-w-3xl w-full mx-auto flex-shrink-0">
          <div className="bg-[#17171c] border border-zinc-700 focus-within:border-zinc-500 rounded-2xl p-2.5 transition-all shadow-xl flex flex-col gap-2">
            
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

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedMode === 'admission_kd'
                  ? 'Ask about KD Polytechnic Patan admissions, cutoffs, CE branch...'
                  : selectedMode === 'student_assistant'
                  ? 'Ask about scholarship online forms, document checklist, GTU portal...'
                  : `Message ${modeDetails[selectedMode].name}...`
              }
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
                  className="p-1.5 hover:bg-[#23232b] rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
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
            CampusAI • Official KD Polytechnic Patan & GTU Student Assistant Desk
          </p>
        </div>
      </main>
    </div>
  );
}