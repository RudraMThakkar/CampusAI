'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Sparkles, MessageSquare, 
  Zap, Brain, LogOut, ChevronDown, Wand2,
  PanelLeftClose, PanelLeft, ArrowUp, 
  FileText, Image as ImageIcon, X, Loader2,
  GraduationCap, HelpCircle, Building2, BookOpen, Phone, Layers,
  Languages
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

export default function ChatDashboard() {
  const [selectedMode, setSelectedMode] = useState<ModeType>('auto');
  const [lang, setLang] = useState<Language>('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Welcome to CampusAI! Ask academic questions, or explore KD Polytechnic Patan admissions and GTU student services.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const langNames: Record<Language, { label: string; native: string }> = {
    en: { label: 'English', native: 'EN' },
    gu: { label: 'ગુજરાતી', native: 'ગુજ' },
    hi: { label: 'हिंदी', native: 'हिं' }
  };

  const modeDetails: Record<ModeType, { name: string; desc: string; badge: string; icon: any }> = {
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
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeSwitch = (mode: ModeType) => {
    setSelectedMode(mode);
    setIsDropdownOpen(false);

    if (mode === 'admission_kd') {
      const welcomeText = {
        en: `**Welcome to K.D. Polytechnic Patan Admission Desk**\n\nI can guide you through:\n* **Step-by-Step ACPDC Admission Process**\n* **Computer Engineering (CE) Department** (Labs, Curriculum, Faculty)\n* **Government Quota Seats & Reservation** (OPEN, SEBC, SC, ST, EWS, TFW)\n* **Official Contact & Help Center**\n\nSelect a chip below or type your question.`,
        gu: `**કે.ડી. પોલિટેકનિક પાટણ એડમિશન ડેસ્કમાં આપનું સ્વાગત છે**\n\nહું તમને નીચેની બાબતોમાં મદદ કરી શકું છું:\n* **ACPDC એડમિશન પ્રક્રિયા (Step-by-Step)**\n* **કમ્પ્યુટર એન્જિનિયરિંગ ડિપાર્ટમેન્ટ** (લેબ્સ, ફેકલ્ટી, પ્લેસમેન્ટ)\n* **સરકારી ક્વોટા અને સીટોની માહિતી** (TFW, OPEN, SEBC, SC, ST, EWS)\n* **કોલેજ સરનામું અને હેલ્પડેસ્ક સંપર્ક**\n\nનીચેનામાંથી વિકલ્પ પસંદ કરો અથવા પ્રશ્ન પૂછો.`,
        hi: `**के.डी. पॉलिटेक्निक पाटण एडमिशन हेल्पडेस्क में आपका स्वागत है**\n\nमैं आपकी इन विषयों में सहायता कर सकता हूँ:\n* **ACPDC एडमिशन प्रक्रिया (स्टेप-बाय-स्टेप)**\n* **कंप्यूटर इंजीनियरिंग विभाग** (लैब्स, फैकल्टी, प्लेसमेंट)\n* **सरकारी कोटा और सीट मैट्रिक्स** (TFW, OPEN, SEBC, SC, ST, EWS)\n* **कॉलेज संपर्क और सहायता केंद्र**\n\nनीचे दिए गए सुझाव पर क्लिक करें या अपना प्रश्न पूछें।`
      };
      setMessages([{ role: 'assistant', content: welcomeText[lang] }]);
    } else if (mode === 'student_assistant') {
      const welcomeText = {
        en: `**CampusAI Student Services Desk**\n\nI can assist with:\n* **Online Form Filling** (Digital Gujarat Scholarship, GTU Exam Form)\n* **Document Checklists** (Income certificate, Caste verification, LC)\n* **GTU Resources** (Syllabus, Question Banks, Lab Manuals)\n\nType your query or click a quick action below.`,
        gu: `**કેમ્પસ-AI વિદ્યાર્થી સેવા કેન્દ્ર**\n\nહું તમને આમાં મદદ કરી શકું છું:\n* **ઓનલાઇન ફોર્મ ભરવા માટે માર્ગદર્શન** (ડિજિટલ ગુજરાત સ્કોલરશિપ, GTU પરીક્ષા ફોર્મ)\n* **જરૂરી ડોક્યુમેન્ટ લિસ્ટ** (આવકનો દાખલો, જાતિ પ્રમાણપત્ર, LC)\n* **GTU અભ્યાસક્રમ અને પેપર્સ**\n\nપ્રશ્ન પૂછો અથવા નીચે આપેલા વિકલ્પ પસંદ કરો.`,
        hi: `**कैंपस-AI छात्र सहायता केंद्र**\n\nमैं आपकी इन सेवाओं में मदद कर सकता हूँ:\n* **ऑनलाइन फॉर्म भरने का मार्गदर्शन** (डिजिटल गुजरात स्कॉलरशिप, GTU परीक्षा फॉर्म)\n* **आवश्यक दस्तावेज सूची** (आय प्रमाण पत्र, जाति प्रमाण पत्र, LC)\n* **GTU स्टडी मटेरियल और सिलेबस**\n\nअपना प्रश्न लिखें या नीचे दिए गए ऑप्शन चुनें।`
      };
      setMessages([{ role: 'assistant', content: welcomeText[lang] }]);
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

  const generateSpecializedResponse = (query: string, mode: ModeType, currentLang: Language) => {
    const q = query.toLowerCase();

    if (mode === 'admission_kd') {
      if (q.includes('step') || q.includes('process') || q.includes('acpdc') || q.includes('પ્રક્રિયા') || q.includes('प्रक्रिया')) {
        if (currentLang === 'gu') {
          return `**કે.ડી. પોલિટેકનિક પાટણ: એડમિશન પ્રક્રિયા (ACPDC)**\n\n1. **ઓનલાઇન રજીસ્ટ્રેશન**: \`gujdiploma.admissions.nic.in\` પર જઈને ધોરણ ૧૦ ના આધારે ફોર્મ ભરો.\n2. **ડોક્યુમેન્ટ વેરિફિકેશન**: ૧૦માની માર્કશીટ, LC અને આવક/જાતિના દાખલા ઓનલાઇન અપલોડ કરો.\n3. **મેરિટ લિસ્ટ**: સ્ટેટ મેરિટ રેન્ક જાહેર થયા પછી તમારો રેન્ક ચેક કરો.\n4. **ચોઈસ ફિલિંગ**: ચોઈસ ફિલિંગમાં **"K.D. POLYTECHNIC, PATAN (Govt.) - Computer Engineering"** પ્રથમ ક્રમે રાખો.\n5. **ટોકન ફી અને કન્ફર્મેશન**: એલોટમેન્ટ પત્ર ડાઉનલોડ કરી સરકારી ટોકન ફી ભરી એડમિશન કન્ફર્મ કરો.\n6. **રિપોર્ટિંગ**: ઓરિજિનલ ડોક્યુમેન્ટ્સ સાથે પાટણ કોલેજ કેમ્પસ ખાતે વેરિફિકેશન પૂર્ણ કરો.`;
        }
        if (currentLang === 'hi') {
          return `**के.डी. पॉलिटेक्निक पाटण: स्टेप-बाय-स्टेप एडमिशन प्रक्रिया (ACPDC)**\n\n1. **ऑनलाइन रजिस्ट्रेशन**: \`gujdiploma.admissions.nic.in\` पर 10वीं के विवरण के साथ फॉर्म भरें।\n2. **दस्तावेज़ सत्यापन**: 10वीं मार्कशीट, LC, आय और जाति प्रमाण पत्र अपलोड करें।\n3. **मेरिट लिस्ट**: ACPDC द्वारा जारी मेरिट रैंक चेक करें।\n4. **च्वाइस फिलिंग**: च्वाइस लिस्ट में **"K.D. POLYTECHNIC, PATAN (Govt.) - Computer Engineering"** को पहली प्राथमिकता दें।\n5. **सीट आवंटन व टोकन शुल्क**: सीट अलॉटमेंट लेटर डाउनलोड कर निर्धारित सरकारी टोकन फीस जमा करें।\n6. **कॉलेज रिपोर्टिंग**: मूल दस्तावेजों के साथ पाटण कॉलेज में रिपोर्ट करें।`;
        }
        return `**Step-by-Step Admission Process for K.D. Polytechnic, Patan (ACPDC)**\n\n1. **Online ACPDC Registration**: Visit \`gujdiploma.admissions.nic.in\` and register with 10th details.\n2. **Document Verification**: Upload 10th marksheet, LC, Caste/Income certificates for e-verification.\n3. **Merit List**: Check your State Merit Rank & Category Rank.\n4. **Choice Filling**: Select **"K.D. POLYTECHNIC, PATAN (Govt.) - Computer Engineering"** as first preference.\n5. **Seat Allotment & Token Fee**: Download seat allotment letter and submit the online token fee.\n6. **Physical Reporting**: Report to the Patan campus with original credentials.`;
      }

      if (q.includes('computer') || q.includes('ce') || q.includes('કમ્પ્યુટર') || q.includes('कंप्यूटर')) {
        if (currentLang === 'gu') {
          return `**કમ્પ્યુટર એન્જિનિયરિંગ ડિપાર્ટમેન્ટ (KDPC પાટણ)**\n\n* **લેબ ફેસિલિટી**: હાઈ-સ્પીડ ઈન્ટરનેટ અને પ્રોગ્રામિંગ (Python, C/C++, Web Dev, AI) માટે સંપૂર્ણ સજ્જ કમ્પ્યુટર લેબ્સ.\n* **અભ્યાસક્રમ**: GTU આધારિત અદ્યતન ડિપ્લોમા એન્જિનિયરિંગ સિલેબસ.\n* **હાયર સ્ટડીઝ (D2D)**: ડિપ્લોમા પછી સીધા બીજા વર્ષની ડિગ્રી એન્જિનિયરિંગ (LDCE, VGEC, GEC) માં પ્રવેશ માટે શ્રેષ્ઠ પ્લેટફોર્મ.`;
        }
        if (currentLang === 'hi') {
          return `**कंप्यूटर इंजीनियरिंग विभाग (KDPC पाटण)**\n\n* **कंप्यूटर लैब्स**: आधुनिक हाई-स्पीड इंटरनेट युक्त प्रोग्रामिंग (Python, C/C++, Web Development) लैब्स।\n* **पाठ्यक्रम**: GTU का इंडस्ट्री-ओरिएंटेड डिप्लोमा इंजीनियरिंग सिलेबस।\n* **उच्च शिक्षा (D2D)**: डिप्लोमा के बाद सीधे डिग्री इंजीनियरिंग सेकंड ईयर (LDCE, VGEC) में प्रवेश के लिए मजबूत मार्गदर्शन।`;
        }
        return `**Computer Engineering Department Overview**\n\n* **Labs & Infrastructure**: High-speed internet connected labs equipped for Python, Web Development, and Database systems.\n* **Faculty & Curriculum**: GTU-aligned diploma curriculum taught by experienced government lecturers.\n* **D2D Pathways**: Strong direct-to-degree admission guidance into premier engineering institutions.`;
      }

      if (q.includes('contact') || q.includes('address') || q.includes('સંપર્ક') || q.includes('સરનામું') || q.includes('संपर्क')) {
        return `**K.D. Polytechnic Patan Official Address**\n\n* **Name**: Kilachand Devchand Polytechnic (KDPC Patan)\n* **Address / Location**: Near HNGU University Highway, Patan - 384265, Gujarat.\n* **Category**: Government Polytechnic Institute\n* **Working Hours**: 10:30 AM to 5:00 PM (Monday to Saturday, 2nd & 4th Sat off).`;
      }
    }

    if (mode === 'student_assistant') {
      if (q.includes('scholarship') || q.includes('digital gujarat') || q.includes('સ્કોલરશિપ') || q.includes('स्कॉलरशिप')) {
        if (currentLang === 'gu') {
          return `**ડિજિટલ ગુજરાત સ્કોલરશિપ ફોર્મ માર્ગદર્શન**\n\n* **જરૂરી આધાર પુરાવા**: આવકનો દાખલો, જાતિનો દાખલો, બેંક પાસબુક (આધાર લિંક), કોલેજ ફી ની પહોંચ, અને બોનાફાઇડ સર્ટિફિકેટ.\n* **પોર્ટલ**: \`digitalgujarat.gov.in\`\n* **સ્ટેપ**: પોર્ટલ પર લોગીન કરો > Scholarship Services પસંદ કરો > યોગ્ય સ્કીમ સિલેક્ટ કરી ડોક્યુમેન્ટ અપલોડ કરો.`;
        }
        if (currentLang === 'hi') {
          return `**डिजिटल गुजरात स्कॉलरशिप ऑनलाइन फॉर्म**\n\n* **आवश्यक दस्तावेज**: आय प्रमाण पत्र, जाति प्रमाण पत्र, बैंक पासबुक (आधार लिंक), कॉलेज फीस रसीद और बोनाफाइड सर्टिफिकेट।\n* **वेबसाइट**: \`digitalgujarat.gov.in\`\n* **प्रक्रिया**: पोर्टल पर नया आवेदन खोलें, बैंक डिटेल्स सत्यापित करें और डॉक्यूमेंट्स अपलोड करें।`;
        }
        return `**Digital Gujarat Scholarship Assistance**\n\n* **Required Documents**: Income certificate, Caste certificate, Bank passbook (Aadhaar seeded), College fee receipt, and Bonafide.\n* **Portal**: \`digitalgujarat.gov.in\`.`;
      }
    }

    return `Query received: "${query}" | Processed in ${langNames[currentLang].label} mode.`;
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
      const reply = generateSpecializedResponse(textToSend, selectedMode, lang);
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: reply,
          usedModel: `${modeDetails[selectedMode].name} (${langNames[lang].native})`
        }
      ]);
      setLoading(false);
    }, 600);
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
        {/* Header with Mode & Language Selector */}
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

            {/* Mode Dropdown */}
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

          {/* Language Switcher Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 bg-[#17171c] hover:bg-[#1f1f26] border border-zinc-700 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-200 transition cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span>{langNames[lang].label}</span>
              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute top-9 right-0 w-36 bg-[#18181d] border border-zinc-700/80 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5 z-50">
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
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-3xl w-full mx-auto">
          {/* Quick Action Suggestion Chips for Specialized Mode */}
          {selectedMode === 'admission_kd' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <button 
                onClick={() => handleSend(lang === 'gu' ? 'કે.ડી. પોલિટેકનિક પાટણની એડમિશન પ્રક્રિયા જણાવો' : lang === 'hi' ? 'केडी पॉलिटेक्निक की एडमिशन प्रक्रिया बताएं' : 'Tell me step-by-step ACPDC admission process for KD Polytechnic')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400 mb-1" />
                <div className="font-medium text-zinc-200">{lang === 'gu' ? 'એડમિશન પ્રક્રિયા' : lang === 'hi' ? 'एडमिशन प्रक्रिया' : 'ACPDC Process'}</div>
                <div className="text-[10px] text-zinc-400">{lang === 'gu' ? 'સ્ટેપ-બાય-સ્ટેપ' : lang === 'hi' ? 'स्टेप्स गाइड' : 'Step-by-step steps'}</div>
              </button>

              <button 
                onClick={() => handleSend(lang === 'gu' ? 'કમ્પ્યુટર એન્જિનિયરિંગ ડિપાર્ટમેન્ટ અને લેબ્સ વિશે જણાવો' : lang === 'hi' ? 'कंप्यूटर इंजीनियरिंग लैब्स और फैकल्टी की जानकारी दें' : 'Tell me about Computer Engineering department labs and faculty')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-400 mb-1" />
                <div className="font-medium text-zinc-200">{lang === 'gu' ? 'કમ્પ્યુટર ડિપાર્ટમેન્ટ' : lang === 'hi' ? 'कंप्यूटर विभाग' : 'CE Department'}</div>
                <div className="text-[10px] text-zinc-400">{lang === 'gu' ? 'લેબ્સ અને ફેકલ્ટી' : lang === 'hi' ? 'लैब्स व फैकल्टी' : 'Labs & faculty'}</div>
              </button>

              <button 
                onClick={() => handleSend(lang === 'gu' ? 'સરકારી ક્વોટા અને TFW સીટો વિશે માહિતી આપો' : lang === 'hi' ? 'सरकारी कोटा और TFW सीट की जानकारी दें' : 'What are the government quota seats and TFW scheme?')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                <div className="font-medium text-zinc-200">{lang === 'gu' ? 'ક્વોટા અને સીટો' : lang === 'hi' ? 'कोटा व सीटें' : 'Quota & Seats'}</div>
                <div className="text-[10px] text-zinc-400">{lang === 'gu' ? 'Govt & TFW' : lang === 'hi' ? 'Govt & TFW' : 'Govt & TFW seats'}</div>
              </button>

              <button 
                onClick={() => handleSend(lang === 'gu' ? 'કે.ડી. પોલિટેકનિક પાટણનું સરનામું અને સંપર્ક નંબર આપો' : lang === 'hi' ? 'केडी पॉलिटेक्निक पाटण का संपर्क विवरण दें' : 'Give me KD Polytechnic Patan contact details and address')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400 mb-1" />
                <div className="font-medium text-zinc-200">{lang === 'gu' ? 'સંપર્ક અને માહિતી' : lang === 'hi' ? 'संपर्क सूत्र' : 'Contact & Info'}</div>
                <div className="text-[10px] text-zinc-400">{lang === 'gu' ? 'કેમ્પસ સરનામું' : lang === 'hi' ? 'कैंपस एड्रेस' : 'Campus address'}</div>
              </button>
            </div>
          )}

          {selectedMode === 'student_assistant' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <button 
                onClick={() => handleSend(lang === 'gu' ? 'ડિજિટલ ગુજરાત સ્કોલરશિપ ફોર્મ ભરવા માટે માર્ગદર્શન આપો' : lang === 'hi' ? 'डिजिटल गुजरात स्कॉलरशिप फॉर्म भरने की जानकारी दें' : 'Guide me step-by-step for Digital Gujarat Scholarship online form')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                <div className="font-medium text-zinc-200">{lang === 'gu' ? 'સ્કોલરશિપ ફોર્મ' : lang === 'hi' ? 'स्कॉलरशिप फॉर्म' : 'Scholarship Forms'}</div>
                <div className="text-[10px] text-zinc-400">Digital Gujarat portal</div>
              </button>

              <button 
                onClick={() => handleSend(lang === 'gu' ? 'એડમિશન અને સ્કોલરશિપ માટે જરૂરી ડોક્યુમેન્ટ્સનું લિસ્ટ આપો' : lang === 'hi' ? 'एडमिशन के लिए जरूरी डॉक्यूमेंट की लिस्ट बताएं' : 'What is the required document checklist for admission and exam forms?')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400 mb-1" />
                <div className="font-medium text-zinc-200">{lang === 'gu' ? 'જરૂરી ડોક્યુમેન્ટ્સ' : lang === 'hi' ? 'दस्तावेज़ सूची' : 'Document Checklist'}</div>
                <div className="text-[10px] text-zinc-400">Income & Caste verify</div>
              </button>

              <button 
                onClick={() => handleSend(lang === 'gu' ? 'GTU કમ્પ્યુટર એન્જિનિયરિંગ સિલેબસ અને પેપર્સ ક્યાં મળશે?' : lang === 'hi' ? 'GTU कंप्यूटर इंजीनियरिंग का सिलेबस कहां मिलेगा?' : 'Where can I get GTU diploma computer engineering syllabus and papers?')}
                className="p-2.5 rounded-xl border border-zinc-800 bg-[#16161b] hover:border-zinc-700 text-left text-xs transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400 mb-1" />
                <div className="font-medium text-zinc-200">{lang === 'gu' ? 'GTU સિલેબસ' : lang === 'hi' ? 'GTU रिसोर्सेज' : 'GTU Resources'}</div>
                <div className="text-[10px] text-zinc-400">Syllabus & papers</div>
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
              <span>
                {lang === 'gu' ? 'માહિતી લાવી રહ્યા છીએ...' : lang === 'hi' ? 'जानकारी प्रोसेस हो रही है...' : 'Fetching college info & verifying steps...'}
              </span>
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
                  ? (lang === 'gu' ? 'કે.ડી. પોલિટેકનિક પાટણ એડમિશન, કટઓફ અને CE સીટો વિશે પૂછો...' : lang === 'hi' ? 'केडी पॉलिटेक्निक पाटण एडमिशन, कटऑफ और CE ब्रांच के बारे में पूछें...' : 'Ask about KD Polytechnic Patan admissions, cutoffs, CE branch...')
                  : selectedMode === 'student_assistant'
                  ? (lang === 'gu' ? 'સ્કોલરશિપ ફોર્મ, ડોક્યુમેન્ટ લિસ્ટ, GTU પોર્ટલ વિશે પૂછો...' : lang === 'hi' ? 'स्कॉलरशिप फॉर्म, डॉक्यूमेंट लिस्ट, GTU पोर्टल के बारे में पूछें...' : 'Ask about scholarship online forms, document checklist, GTU portal...')
                  : (lang === 'gu' ? 'કોઈપણ પ્રશ્ન પૂછો...' : lang === 'hi' ? 'कोई भी प्रश्न पूछें...' : `Message ${modeDetails[selectedMode].name}...`)
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
            CampusAI • K.D. Polytechnic Patan & GTU Multilingual Assistant (EN / ગુજ / हिं)
          </p>
        </div>
      </main>
    </div>
  );
}