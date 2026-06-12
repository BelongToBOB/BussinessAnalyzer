'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getBusiness, getSession } from '@/lib/api';
import { calcBusinessScore } from '@/lib/ib-score';
import { BottomNav } from '@/components/ui/bottom-nav';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'DSCR ของผมผ่านเกณฑ์ไหม?',
  'ควรขอวงเงินเท่าไรดี?',
  'เอกสารที่ต้องเตรียมมีอะไรบ้าง?',
  'จุดอ่อนที่ต้องแก้ก่อนยื่นกู้คืออะไร?',
  'ธนาคารจะมองธุรกิจผมอย่างไร?',
  'Growth Cash ติดลบ แก้ยังไง?',
];

function MdMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
        li: ({ children }) => <li>{children}</li>,
      }}
    >{content}</ReactMarkdown>
  );
}

const VERDICT_MAP: Record<string, { label: string; color: string; bg: string }> = {
  'Ready to Structure': { label: 'Ready to Structure', color: 'text-status-good', bg: 'bg-wash-good' },
  'Expansion-Ready': { label: 'Expansion-Ready', color: 'text-status-good', bg: 'bg-wash-good' },
  'Need Cleanup': { label: 'Need Cleanup', color: 'text-status-warn', bg: 'bg-wash-warn' },
  'High Risk': { label: 'High Risk', color: 'text-status-bad', bg: 'bg-wash-bad' },
};

export default function BankSimPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [verdict, setVerdict] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const slugs = ['ib-identity', 'ib-financial', 'ib-cash-dna', 'ib-bank-view', 'ib-capital', 'ib-growth', 'ib-loan-action'];
        const results = await Promise.allSettled(slugs.map(s => getSession(s)));
        const d: Record<string, any> = {};
        slugs.forEach((s, i) => {
          if (results[i].status === 'fulfilled') d[s] = (results[i] as any).value;
        });

        const { score: s } = calcBusinessScore(d);
        setScore(s);

        // Determine verdict
        const fin = d['ib-financial']?.computed;
        const cash = d['ib-cash-dna']?.computed;
        const effectiveDscr = fin?.dscr ?? Infinity;
        const effectiveDe = fin?.de ?? 0;
        const growthPositive = (cash?.growthCash || 0) >= 0;

        if (fin) {
          if (effectiveDscr < 1.0 || (!growthPositive && effectiveDe > 3)) setVerdict('High Risk');
          else if (effectiveDscr >= 1.5 && effectiveDe <= 2.5 && growthPositive) setVerdict('Ready to Structure');
          else if (effectiveDscr < 1.25 || !growthPositive || effectiveDe > 2.5) setVerdict('Need Cleanup');
          else setVerdict('Ready to Structure');
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setSending(true);
    setStreaming('');

    try {
      let userId: string | null = null;
      try { userId = localStorage.getItem('_uid'); } catch {}

      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(userId ? { 'X-User-Id': userId } : {}) },
        body: JSON.stringify({ message: msg, history: newMessages.slice(-10) }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && res.body) {
        setSending(false);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) { fullText += parsed.text; setStreaming(fullText); }
              } catch {}
            }
          }
        }
        setStreaming('');
        setMessages([...newMessages, { role: 'assistant', content: fullText }]);
      } else if (contentType.includes('application/json')) {
        const data = await res.json();
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
        setSending(false);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'เชื่อมต่อไม่ได้ กรุณาลองใหม่' }]);
        setSending(false);
      }
    } catch {
      setMessages([...messages, { role: 'user', content: msg }, { role: 'assistant', content: 'เชื่อมต่อไม่ได้ กรุณาลองใหม่' }]);
      setSending(false);
      setStreaming('');
    }
  };

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  const v = VERDICT_MAP[verdict];
  const hasMessages = messages.length > 0 || streaming;

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border shrink-0">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Bank Simulation</div>
            <div className="text-[10px] text-text-tertiary">จำลองสัมภาษณ์สินเชื่อกับ Virtual RM</div>
          </div>
        </div>
      </header>

      {/* Score banner */}
      {score > 0 && (
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 pt-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${v?.bg || 'bg-bg-card border border-border'}`}>
            <div className="num text-lg font-bold text-text-primary">Business Score: {score}/100</div>
            {v && <span className={`text-sm font-semibold ${v.color}`}>· {v.label}</span>}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 max-w-3xl mx-auto w-full">
        {/* Welcome message — always show */}
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            RM
          </div>
          <div className="flex-1 bg-bg-card border border-border rounded-2xl rounded-tl-md p-4 text-sm leading-relaxed">
            <p className="mb-2">สวัสดีครับ ผมคือ <strong>Virtual RM</strong> จาก InsideBank</p>
            <p className="mb-2">ผมได้ดูข้อมูล Business MRI ของคุณแล้ว และพร้อมจำลองการสัมภาษณ์สินเชื่อแบบที่ธนาคารทำจริง</p>
            <p className="mb-2"><strong>คุณสามารถถามผมได้เลย เช่น:</strong></p>
            <ul className="list-disc pl-5 mb-2 space-y-1 text-text-secondary">
              <li>"ธนาคารจะมองธุรกิจผมอย่างไร?"</li>
              <li>"ผมควรเตรียมเอกสารอะไรบ้าง?"</li>
              <li>"DSCR ของผมผ่านเกณฑ์ไหม?"</li>
              <li>"วงเงินที่ขอได้เหมาะสมไหม?"</li>
            </ul>
            <p className="text-text-secondary">ลองถามมาได้เลยครับ</p>
          </div>
        </div>

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 mb-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold mt-1"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                RM
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'rounded-2xl rounded-br-md text-white'
                : 'bg-bg-card border border-border rounded-2xl rounded-tl-md text-text-primary'
            }`}
              style={m.role === 'user' ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' } : {}}>
              {m.role === 'assistant' ? <MdMessage content={m.content} /> : m.content}
            </div>
          </div>
        ))}

        {/* Streaming */}
        {streaming && (
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold mt-1"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              RM
            </div>
            <div className="max-w-[85%] px-4 py-3 bg-bg-card border border-border rounded-2xl rounded-tl-md text-sm leading-relaxed text-text-primary">
              <MdMessage content={streaming} />
              <span className="inline-block w-1.5 h-4 bg-text-tertiary animate-pulse ml-0.5 align-middle rounded-sm" />
            </div>
          </div>
        )}

        {/* Loading dots */}
        {sending && !streaming && (
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              RM
            </div>
            <div className="px-4 py-3 bg-bg-card border border-border rounded-2xl rounded-tl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions — only when no messages yet */}
      {!hasMessages && (
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 pb-2">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                className="text-xs px-3 py-2 rounded-full border border-border bg-bg-card text-text-primary cursor-pointer hover:border-accent hover:text-accent transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-3 pb-20 shrink-0">
        <div className="flex items-center gap-2">
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            placeholder="ถามคำถามเกี่ยวกับสินเชื่อ..."
            disabled={sending}
            className="flex-1 h-12 rounded-xl border border-border px-4 text-sm bg-bg-card text-text-primary outline-none focus:border-accent font-thai disabled:opacity-50" />
          <button onClick={() => sendMessage()} disabled={!input.trim() || sending}
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer border-none disabled:opacity-30 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <Send size={18} color="#fff" />
          </button>
        </div>
        <div className="text-[9px] text-text-tertiary text-center mt-1.5">
          ผลลัพธ์เป็นการจำลองเพื่อการเรียนรู้ ไม่ใช่ผลอนุมัติสินเชื่อจริง
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
