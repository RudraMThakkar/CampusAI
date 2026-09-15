'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidChart from '@/components/MermaidChart';
import { 
  Plus, MessageSquare, LogOut, PanelLeftClose, PanelLeft, ArrowUp, 
  FileText, Image as ImageIcon, X, Loader2,
  GraduationCap, HelpCircle,
  Languages, Copy, Check, Share2,
  Trash2, Edit2, BookOpen, Award, Building, Compass, UserCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ServiceMode = 'admission_kd' | 'student_assistant';
type Language = 'en' | 'gu' | 'hi';

interface AttachedFile {
  name: string;
  type: string;
  mimeType: string;
  size: string;
  data?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: AttachedFile[];
  serviceTitle?: string;
}

interface ConversationItem {
  id: string;
  title: string;
  mode: string;
  created_at: string;
}

// Complete UI Translations Dictionary
const UI_TEXT = {
  en: {
    appTitle: 'K.D. Polytechnic AI',
    newChat: 'New Chat',
    campusServices: 'Campus Services',
    admissionDesk: 'KD Admission Desk',
    studentAssistant: 'AI Student Assistant',
    recentConversations: 'Recent Conversations',
    noChats: 'No previous chats',
    guestBanner: 'Guest Session (Unsaved)',
    guestNotice: 'Guest chats are private and not saved',
    signOut: 'Sign Out',
    exitGuest: 'Exit Guest Mode',
    share: 'Share',
    copied: 'Copied',
    welcomeTitle: 'K.D. Polytechnic Patan Academic Portal',
    welcomeSubtitle: 'Select a frequently asked inquiry below or type your questions regarding admission, scholarships, and GTU exams.',
    inputPlaceholderAdmission: 'Ask about admission procedure, ACPDC merit, eligibility, or hostel...',
    inputPlaceholderStudent: 'Ask about scholarships, GTU exam forms, syllabus, or circulars...',
    footerNote: 'Kilachand Devchand Polytechnic, Patan • GTU Affiliated Government Institute Helpdesk',
    generating: 'Generating response...',
    card1Title: 'ACPDC Admission & Merit',
    card1Desc: 'Eligibility, 10th cut-offs, and seat matrix for Diploma Computer Engineering.',
    card1Query: 'What is the ACPDC admission procedure and cut-off for Computer Engineering at K.D. Polytechnic Patan?',
    card2Title: 'Scholarship Schemes',
    card2Desc: 'MYSY, Digital Gujarat SC/ST/OBC, and freeship card eligibility.',
    card2Query: 'What scholarships are available for diploma engineering students in Gujarat (MYSY and Digital Gujarat)?',
    card3Title: 'GTU Syllabus & Exams',
    card3Desc: 'Semester curriculum, exam form deadlines, and credit scheme.',
    card3Query: 'How to check GTU Diploma Engineering syllabus, semester credits, and exam schedules?',
    card4Title: 'Hostel & Campus Facilities',
    card4Desc: 'Boys hostel allocation, annual charges, mess, and laboratory infrastructure.',
    card4Query: 'What are the hostel admission rules, fees, and campus facilities at K.D. Polytechnic Patan?',
    initialWelcome: 'Welcome to K.D. Polytechnic Patan Helpdesk! You can ask questions regarding admissions, fees, eligibility, hostel facilities, or GTU student services.'
  },
  gu: {
    appTitle: 'કે.ડી. પોલિટેકનિક AI',
    newChat: 'નવી વાતચીત',
    campusServices: 'કેમ્પસ સેવાઓ',
    admissionDesk: 'કે.ડી. પ્રવેશ સહાયતા',
    studentAssistant: 'વિદ્યાર્થી સહાયક AI',
    recentConversations: 'તાજેતરની વાતચીત',
    noChats: 'કોઈ જૂની વાતચીત નથી',
    guestBanner: 'મહેમાન સત્ર (સેવ નહીં થાય)',
    guestNotice: 'મહેમાન ચેટ્સ ખાનગી છે અને સાચવવામાં આવતી નથી',
    signOut: 'સાઇન આઉટ',
    exitGuest: 'ગેસ્ટ મોડમાંથી બહાર નીકળો',
    share: 'શેર કરો',
    copied: 'કૉપિ થઈ ગયું',
    welcomeTitle: 'કે.ડી. પોલિટેકનિક પાટણ શૈક્ષણિક પોર્ટલ',
    welcomeSubtitle: 'નીચે આપેલા મહત્વના પ્રશ્નોમાંથી પસંદ કરો અથવા પ્રવેશ, શિષ્યવૃત્તિ અને જીટીયુ પરીક્ષા સંબંધિત પ્રશ્નો પૂછો.',
    inputPlaceholderAdmission: 'પ્રવેશ પ્રક્રિયા, ACPDC મેરિટ, લાયકાત અથવા હોસ્ટેલ વિશે પૂછો...',
    inputPlaceholderStudent: 'શિષ્યવૃત્તિ (MYSY), GTU પરીક્ષા ફોર્મ, અભ્યાસક્રમ અથવા પરિપત્રો વિશે પૂછો...',
    footerNote: 'કિલાચંદ દેવચંદ પોલિટેકનિક, પાટણ • GTU સંલગ્ન સરકારી ઇન્સ્ટિટ્યૂટ હેલ્પડેસ્ક',
    generating: 'જવાબ તૈયાર થઈ રહ્યો છે...',
    card1Title: 'ACPDC પ્રવેશ અને મેરિટ',
    card1Desc: 'ડિપ્લોમા કમ્પ્યુટર એન્જિનિયરિંગ માટે લાયકાત, ૧૦મા પછીના કટ-ઓફ અને બેઠકોની વિગત.',
    card1Query: 'કે.ડી. પોલિટેકનિક પાટણમાં કમ્પ્યુટર એન્જિનિયરિંગ માટે ACPDC પ્રવેશ પ્રક્રિયા અને મેરિટ કટ-ઓફ શું છે?',
    card2Title: 'શિષ્યવૃત્તિ યોજનાઓ',
    card2Desc: 'MYSY, ડિજિટલ ગુજરાત SC/ST/OBC અને ફ્રીશીપ કાર્ડની લાયકાત.',
    card2Query: 'ગુજરાતમાં ડિપ્લોમા એન્જિનિયરિંગ વિદ્યાર્થીઓ માટે કઈ શિષ્યવૃત્તિઓ ઉપલબ્ધ છે (MYSY અને ડિજિટલ ગુજરાત)?',
    card3Title: 'GTU અભ્યાસક્રમ અને પરીક્ષાઓ',
    card3Desc: 'સેમેસ્ટર અભ્યાસક્રમ, પરીક્ષા ફોર્મ ભરવાની તારીખો અને ક્રેડિટ સિસ્ટમ.',
    card3Query: 'GTU ડિપ્લોમા એન્જિનિયરિંગનો સિલેબસ, ક્રેડિટ સ્કીમ અને પરીક્ષા ટાઈમટેબલ કેવી રીતે તપાસવું?',
    card4Title: 'હોસ્ટેલ અને કેમ્પસ સુવિધાઓ',
    card4Desc: 'બોયઝ હોસ્ટેલ પ્રવેશ, વાર્ષિક ફી, મેસ અને પ્રયોગશાળા સુવિધાઓ.',
    card4Query: 'કે.ડી. પોલિટેકનિક પાટણ ખાતે હોસ્ટેલના નિયમો, ફી અને કેમ્પસની સુવિધાઓ શું છે?',
    initialWelcome: 'કે.ડી. પોલિટેકનિક પાટણ હેલ્પડેસ્કમાં આપનું સ્વાગત છે! આપ પ્રવેશ, ફી, હોસ્ટેલ અથવા જીટીયુ વિદ્યાર્થી સેવાઓ વિશે પૂછી શકો છો.'
  },
  hi: {
    appTitle: 'के.डी. पॉलिटेक्निक AI',
    newChat: 'नई बातचीत',
    campusServices: 'परिसर सेवाएँ',
    admissionDesk: 'के.डी. प्रवेश डेस्क',
    studentAssistant: 'विद्यार्थी सहायक AI',
    recentConversations: 'हाल की बातचीत',
    noChats: 'कोई पुरानी बातचीत नहीं',
    guestBanner: 'अतिथि सत्र (सेव नहीं होगा)',
    guestNotice: 'अतिथि चैट निजी हैं और सहेजी नहीं जाती हैं',
    signOut: 'साइन आउट',
    exitGuest: 'गेस्ट मोड से बाहर निकलें',
    share: 'शेयर करें',
    copied: 'कॉपी हुआ',
    welcomeTitle: 'के.डी. पॉलिटेक्निक पाटन शैक्षणिक पोर्टल',
    welcomeSubtitle: 'नीचे दिए गए महत्वपूर्ण प्रश्नों में से चुनें या प्रवेश, छात्रवृत्ति और जीटीयू परीक्षा संबंधी प्रश्न पूछें।',
    inputPlaceholderAdmission: 'प्रवेश प्रक्रिया, ACPDC मेरिट, योग्यता या हॉस्टल के बारे में पूछें...',
    inputPlaceholderStudent: 'छात्रवृत्ति (MYSY), GTU परीक्षा फॉर्म, पाठ्यक्रम या परिपत्रों के बारे में पूछें...',
    footerNote: 'किलाचंद देवचंद पॉलिटेक्निक, पाटन • GTU संबद्ध सरकारी संस्थान हेल्पडेस्क',
    generating: 'उत्तर तैयार हो रहा है...',
    card1Title: 'ACPDC प्रवेश और मेरिट',
    card1Desc: 'डिप्लोमा कंप्यूटर इंजीनियरिंग के लिए पात्रता, 10वीं के कट-ऑफ और सीटों का विवरण।',
    card1Query: 'के.डी. पॉलिटेक्निक पाटन में कंप्यूटर इंजीनियरिंग के लिए ACPDC प्रवेश प्रक्रिया और कट-ऑफ क्या है?',
    card2Title: 'छात्रवृत्ति योजनाएँ',
    card2Desc: 'MYSY, डिजिटल गुजरात SC/ST/OBC और फ्रीशिप कार्ड की पात्रता।',
    card2Query: 'गुजरात में डिप्लोमा इंजीनियरिंग छात्रों के लिए कौन सी छात्रवृत्तियाँ उपलब्ध हैं (MYSY और डिजिटल गुजरात)?',
    card3Title: 'GTU पाठ्यक्रम और परीक्षाएँ',
    card3Desc: 'सेमेस्टर पाठ्यक्रम, परीक्षा फॉर्म की समय-सीमा और क्रेडिट योजना।',
    card3Query: 'GTU डिप्लोमा इंजीनियरिंग पाठ्यक्रम, क्रेडिट और परीक्षा कार्यक्रम कैसे देखें?',
    card4Title: 'हॉस्टल और परिसर सुविधाएँ',
    card4Desc: 'बॉयज हॉस्टल आवंटन, वार्षिक शुल्क, मेस और प्रयोगशाला की सुविधा।',
    card4Query: 'के.डी. पॉलिटेक्निक पाटन में हॉस्टल नियम, शुल्क और परिसर की सुविधाएँ क्या हैं?',
    initialWelcome: 'के.डी. पॉलिटेक्निक पाटन हेल्पडेस्क में आपका स्वागत है! आप प्रवेश, शुल्क, हॉस्टल या जीटीयू छात्र सेवाओं के बारे में प्रश्न पूछ सकते हैं।'
  }
};

export default function ChatDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  const [selectedMode, setSelectedMode] = useState<ServiceMode>('admission_kd');
  const [lang, setLang] = useState<Language>('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  
  const t = UI_TEXT[lang];

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: UI_TEXT.en.initialWelcome 
    }
  ]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sharedCopied, setSharedCopied] = useState(false);

  const isUserScrolledUpRef = useRef<boolean>(false);

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const langNames: Record<Language, { label: string; native: string }> = {
    en: { label: 'English', native: 'EN' },
    gu: { label: 'ગુજરાતી', native: 'ગુજ' },
    hi: { label: 'हिंदी', native: 'हिं' }
  };

  const actionCards = [
    {
      title: t.card1Title,
      desc: t.card1Desc,
      query: t.card1Query,
      icon: Compass,
      mode: 'admission_kd' as ServiceMode
    },
    {
      title: t.card2Title,
      desc: t.card2Desc,
      query: t.card2Query,
      icon: Award,
      mode: 'student_assistant' as ServiceMode
    },
    {
      title: t.card3Title,
      desc: t.card3Desc,
      query: t.card3Query,
      icon: BookOpen,
      mode: 'student_assistant' as ServiceMode
    },
    {
      title: t.card4Title,
      desc: t.card4Desc,
      query: t.card4Query,
      icon: Building,
      mode: 'admission_kd' as ServiceMode
    }
  ];

  const scrollToBottom = (force = false) => {
    if (!chatContainerRef.current) return;
    if (force || !isUserScrolledUpRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleContainerScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isUserScrolledUpRef.current = distanceFromBottom > 120;
  };

  const handleUserWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      isUserScrolledUpRef.current = true;
    }
  };

  useEffect(() => {
    const checkGuestMode = typeof window !== 'undefined' && sessionStorage.getItem('isGuest') === 'true';

    if (checkGuestMode) {
      setIsGuest(true);
      return;
    }

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
    if (isGuest) return;

    try {
      setActiveConversationId(convoId);
      if (convoMode === 'student_assistant' || convoMode === 'admission_kd') {
        setSelectedMode(convoMode);
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
            serviceTitle: m.used_model,
          }))
        );
        isUserScrolledUpRef.current = false;
        setTimeout(() => scrollToBottom(true), 50);
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
        content: t.initialWelcome
      }
    ]);
    setAttachedFiles([]);
    setInput('');
    isUserScrolledUpRef.current = false;
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convoId: string) => {
    e.stopPropagation();
    if (isGuest) return;
    if (!window.confirm('Delete this conversation permanently?')) return;

    try {
      await supabase.from('messages').delete().eq('conversation_id', convoId);
      const { error } = await supabase.from('conversations').delete().eq('id', convoId);

      if (!error) {
        setConversations((prev) => prev.filter((c) => c.id !== convoId));
        if (activeConversationId === convoId) {
          startNewChat();
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const startRenaming = (e: React.MouseEvent, convo: ConversationItem) => {
    e.stopPropagation();
    if (isGuest) return;
    setEditingChatId(convo.id);
    setEditTitleInput(convo.title);
  };

  const handleSaveRename = async (e: React.FormEvent | React.FocusEvent, convoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) return;

    const trimmed = editTitleInput.trim();
    if (!trimmed) {
      setEditingChatId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: trimmed, updated_at: new Date().toISOString() })
        .eq('id', convoId);

      if (!error) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convoId ? { ...c, title: trimmed } : c))
        );
      }
    } catch (err) {
      console.error('Error renaming conversation:', err);
    } finally {
      setEditingChatId(null);
    }
  };

  const copyMessageContent = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleShareChat = () => {
    if (isGuest || !activeConversationId) {
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
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToMessage = (index: number) => {
    const target = messageRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      isUserScrolledUpRef.current = true;
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const processedFiles: AttachedFile[] = [];

    for (const file of fileList) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = (reader.result as string) || '';
          const base64Data = res.split(',')[1] || '';
          resolve(base64Data);
        };
        reader.readAsDataURL(file);
      });

      const actualMime = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      processedFiles.push({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'doc',
        mimeType: actualMime,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        data: base64,
      });
    }

    setAttachedFiles((prev) => [...prev, ...processedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (overrideText?: string, overrideMode?: ServiceMode) => {
    const textToSend = (overrideText || input).trim();
    if ((!textToSend && attachedFiles.length === 0) || loading) return;

    const activeMode = overrideMode || selectedMode;
    if (overrideMode) setSelectedMode(overrideMode);

    const userFiles = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const deskLabel = activeMode === 'admission_kd' ? t.admissionDesk : t.studentAssistant;

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: textToSend, files: userFiles },
      { role: 'assistant', content: '', serviceTitle: deskLabel },
    ]);
    setLoading(true);

    isUserScrolledUpRef.current = false;
    setTimeout(() => scrollToBottom(true), 20);

    try {
      let currentConvoId = activeConversationId;

      if (!isGuest && !currentConvoId && userId) {
        const titleSnippet = textToSend.slice(0, 28) || (userFiles[0]?.name.slice(0, 28) ?? 'Document Inquiry');
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert([{ user_id: userId, title: titleSnippet, mode: activeMode }])
          .select()
          .single();

        if (newConvo?.id) {
          currentConvoId = newConvo.id;
          setActiveConversationId(currentConvoId);
          fetchConversations(userId);
        }
      }

      if (!isGuest && currentConvoId) {
        await supabase
          .from('messages')
          .insert([{ conversation_id: currentConvoId, role: 'user', content: textToSend || `[Attached: ${userFiles.map((f) => f.name).join(', ')}]` }]);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          mode: activeMode,
          language: lang,
          files: userFiles.map((f) => ({
            name: f.name,
            type: f.mimeType,
            data: f.data,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let tokenQueue = '';
      let displayedContent = '';
      let isReading = true;

      const typeInterval = setInterval(() => {
        if (tokenQueue.length > 0) {
          const chunk = tokenQueue.slice(0, 3);
          tokenQueue = tokenQueue.slice(3);
          displayedContent += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = displayedContent;
            }
            return updated;
          });

          scrollToBottom(false);
        } else if (!isReading) {
          clearInterval(typeInterval);
          if (!isGuest && currentConvoId && displayedContent) {
            supabase
              .from('messages')
              .insert([{ conversation_id: currentConvoId, role: 'assistant', content: displayedContent, used_model: deskLabel }]);
          }
          setLoading(false);
        }
      }, 18);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          isReading = false;
          break;
        }
        tokenQueue += decoder.decode(value, { stream: true });
      }

    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = `Connection error: ${err.message}`;
          lastMsg.serviceTitle = 'System Help';
        }
        return updated;
      });
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
    if (isGuest) {
      sessionStorage.removeItem('isGuest');
      window.location.href = '/';
      return;
    }
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const userPromptIndices = messages
    .map((msg, index) => (msg.role === 'user' ? index : null))
    .filter((val): val is number => val !== null);

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 font-sans antialiased">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 border-r border-[#13395e] bg-[#0b2545] text-slate-100 flex flex-col justify-between overflow-hidden flex-shrink-0 shadow-lg`}>
        <div className="p-3 flex flex-col gap-3 min-w-[16rem] overflow-y-auto">
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
              {t.appTitle}
            </span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-[#13395e] rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {isGuest && (
            <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-400/30 text-amber-300 px-2.5 py-1.5 rounded-lg text-[11px] font-medium">
              <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t.guestBanner}</span>
            </div>
          )}

          <button 
            onClick={startNewChat}
            className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border border-amber-500/30 bg-[#13395e] hover:bg-[#184877] text-white text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.newChat}</span>
          </button>

          <div className="mt-2 flex flex-col gap-1">
            <div className="text-[11px] font-semibold text-slate-300 px-2 py-1 uppercase tracking-wider">{t.campusServices}</div>
            
            <button 
              onClick={() => setSelectedMode('admission_kd')}
              className={`flex items-center gap-2.5 text-left text-xs px-2.5 py-2 rounded-lg transition cursor-pointer ${
                selectedMode === 'admission_kd' ? 'bg-[#184877] text-amber-300 font-bold border border-amber-400/30' : 'text-slate-200 hover:bg-[#13395e]'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span className="truncate">{t.admissionDesk}</span>
            </button>

            <button 
              onClick={() => setSelectedMode('student_assistant')}
              className={`flex items-center gap-2.5 text-left text-xs px-2.5 py-2 rounded-lg transition cursor-pointer ${
                selectedMode === 'student_assistant' ? 'bg-[#184877] text-amber-300 font-bold border border-amber-400/30' : 'text-slate-200 hover:bg-[#13395e]'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span className="truncate">{t.studentAssistant}</span>
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-0.5">
            <div className="text-[11px] font-semibold text-slate-300 px-2 py-1 uppercase tracking-wider">{t.recentConversations}</div>
            {isGuest ? (
              <p className="text-[11px] text-slate-400 px-2 py-1 italic">{t.guestNotice}</p>
            ) : conversations.length === 0 ? (
              <p className="text-[11px] text-slate-300 px-2 py-1 italic">{t.noChats}</p>
            ) : (
              conversations.map((convo) => (
                <div 
                  key={convo.id}
                  onClick={() => loadConversationMessages(convo.id, convo.mode)}
                  className={`flex items-center justify-between text-left text-xs px-2.5 py-2 rounded-lg group transition cursor-pointer ${
                    activeConversationId === convo.id ? 'bg-[#184877] text-white font-medium border border-slate-600' : 'text-slate-200 hover:text-white hover:bg-[#13395e]/80'
                  }`}
                >
                  {editingChatId === convo.id ? (
                    <form 
                      onSubmit={(e) => handleSaveRename(e, convo.id)} 
                      className="flex-1 mr-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        onBlur={(e) => handleSaveRename(e, convo.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                        className="w-full bg-[#0b2545] border border-amber-400 text-white text-xs px-1.5 py-0.5 rounded focus:outline-none"
                      />
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-300 group-hover:text-amber-300" />
                      <span className="truncate">{convo.title}</span>
                    </div>
                  )}

                  {editingChatId !== convo.id && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={(e) => startRenaming(e, convo)}
                        title="Rename Chat"
                        className="p-1 hover:bg-[#0b2545] rounded text-slate-300 hover:text-amber-300 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, convo.id)}
                        title="Delete Chat"
                        className="p-1 hover:bg-[#0b2545] rounded text-slate-300 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-3 border-t border-[#13395e] min-w-[16rem]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white w-full px-2 py-2 rounded-lg hover:bg-[#13395e] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isGuest ? t.exitGuest : t.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative bg-slate-50 overflow-hidden">
        <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer mr-1"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedMode('admission_kd')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  selectedMode === 'admission_kd'
                    ? 'bg-[#003366] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{t.admissionDesk}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode('student_assistant')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  selectedMode === 'student_assistant'
                    ? 'bg-[#003366] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t.studentAssistant}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareChat}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 transition cursor-pointer"
              title="Copy share link"
            >
              {sharedCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{sharedCopied ? t.copied : t.share}</span>
            </button>

            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-800 transition cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5 text-[#003366]" />
                <span>{langNames[lang].label}</span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute top-9 right-0 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 flex flex-col gap-0.5 z-50">
                  {(['en', 'gu', 'hi'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLang(l);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        lang === l ? 'bg-slate-100 text-[#003366] font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{langNames[l].label}</span>
                      <span className="text-[10px] text-slate-400">{langNames[l].native}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Message Feed Container */}
        <div className="flex-1 relative overflow-hidden flex">
          <div 
            ref={chatContainerRef} 
            onScroll={handleContainerScroll}
            onWheel={handleUserWheel}
            onTouchMove={handleContainerScroll}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-3xl w-full mx-auto"
          >
            {messages.length === 1 && (
              <div className="pt-2 pb-4">
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-400/30 mb-3">
                    <GraduationCap className="w-7 h-7 text-[#003366]" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    {t.welcomeTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {t.welcomeSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {actionCards.map((card, idx) => {
                    const CardIcon = card.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(card.query, card.mode)}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#003366] hover:shadow-md transition text-left cursor-pointer group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 text-[#003366] group-hover:bg-[#003366] group-hover:text-white transition flex-shrink-0">
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#003366] transition">
                            {card.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {card.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                          <div key={fi} className="flex items-center gap-1.5 bg-slate-200 border border-slate-300 text-slate-800 text-xs px-2.5 py-1 rounded-lg">
                            {f.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> : <FileText className="w-3.5 h-3.5 text-amber-600" />}
                            <span className="max-w-[120px] truncate">{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.content && (
                      <div className="max-w-[80%] bg-[#003366] text-white px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xs">
                        {msg.content}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-1">
                    {msg.serviceTitle && (
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-1">
                        <GraduationCap className="w-3.5 h-3.5 text-[#003366]" />
                        {msg.serviceTitle}
                      </span>
                    )}
                    <div className="max-w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-800 text-[14px] leading-relaxed pr-4 overflow-x-auto w-full shadow-xs">
                      {msg.content ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({node, ...props}) => (
                              <table className="border-collapse border border-slate-300 my-3 text-xs w-full text-left bg-white" {...props} />
                            ),
                            th: ({node, ...props}) => (
                              <th className="border border-slate-300 bg-slate-100 px-3 py-2 font-semibold text-slate-900" {...props} />
                            ),
                            td: ({node, ...props}) => (
                              <td className="border border-slate-200 px-3 py-1.5 text-slate-700" {...props} />
                            ),
                            p: ({node, ...props}) => <p className="mb-2.5 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2.5 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2.5 space-y-1" {...props} />,
                            code: ({node, inline, className, children, ...props}: any) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');

                              if (!inline && match && match[1] === 'mermaid') {
                                return <MermaidChart chart={codeString} />;
                              }

                              return (
                                <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-200" {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#003366]" />
                          <span>{t.generating}</span>
                        </div>
                      )}
                    </div>

                    {msg.content && (
                      <div className="flex items-center gap-2 mt-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => copyMessageContent(msg.content, index)}
                          className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md transition cursor-pointer shadow-xs"
                          title="Copy answer"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">{t.copied}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {userPromptIndices.length > 1 && (
            <div className="hidden md:flex flex-col items-center justify-center gap-2 pr-3 pl-1 py-4 z-20 select-none">
              <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-full py-2 px-1 flex flex-col items-center gap-2 shadow-xs">
                {userPromptIndices.map((msgIndex, dotIdx) => (
                  <button
                    key={msgIndex}
                    onClick={() => scrollToMessage(msgIndex)}
                    title={`Question #${dotIdx + 1}`}
                    className="group relative flex items-center justify-center p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  >
                    <span className="h-2 w-2 rounded-full bg-slate-400 group-hover:bg-[#003366] transition-all duration-200" />
                    <span className="absolute right-6 bg-slate-900 border border-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      Question #{dotIdx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-transparent max-w-3xl w-full mx-auto flex-shrink-0">
          <div className="bg-white border border-slate-300 focus-within:border-[#003366] rounded-2xl p-2.5 transition-all shadow-md flex flex-col gap-2">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1 pt-1">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs pl-2.5 pr-1.5 py-1 rounded-lg">
                    {file.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> : <FileText className="w-3.5 h-3.5 text-amber-600" />}
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button onClick={() => removeFile(idx)} className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
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
                  ? t.inputPlaceholderAdmission
                  : t.inputPlaceholderStudent
              }
              className="w-full bg-transparent px-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-none min-h-[24px] max-h-[180px] leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
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
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  title="Attach verification documents or forms"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && attachedFiles.length === 0)}
                className="h-8 w-8 rounded-xl bg-[#003366] hover:bg-[#002244] disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition cursor-pointer flex-shrink-0 shadow-xs"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-center text-slate-500 mt-2">
            {t.footerNote}
          </p>
        </div>
      </main>
    </div>
  );
}