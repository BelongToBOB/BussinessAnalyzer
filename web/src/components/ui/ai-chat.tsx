'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function BotIcon({ size = 24 }: { size?: number }) {
  return <img src="/winwinai.svg" alt="RM AI" width={size} height={size} />;
}

const SUGGESTIONS = [
  'ธุรกิจพร้อมกู้มั้ย?',
  'DSCR คืออะไร?',
  'ควรปรับอะไรก่อน?',
  'สรุปผลสแกนให้หน่อย',
  'LTV สูงไป ทำยังไงดี?',
  'Step 2 กรอกอะไรบ้าง?',
];

function MdMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      }}
    >{content}</ReactMarkdown>
  );
}

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem('_chat'); if (s) setMessages(JSON.parse(s)); } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, streaming]);

  useEffect(() => {
    if (hydrated) try { localStorage.setItem('_chat', JSON.stringify(messages)); } catch {}
  }, [messages, hydrated]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
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

      // Streaming response (SSE)
      if (contentType.includes('text/event-stream') && res.body) {
        setLoading(false);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  setStreaming(fullText);
                }
              } catch {}
            }
          }
        }

        setStreaming('');
        setMessages([...newMessages, { role: 'assistant', content: fullText }]);
      }
      // JSON fallback (error/limit)
      else if (contentType.includes('application/json')) {
        const data = await res.json();
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
        setLoading(false);
      }
      else {
        setMessages([...newMessages, { role: 'assistant', content: 'เชื่อมต่อไม่ได้ กรุณาลองใหม่' }]);
        setLoading(false);
      }
    } catch {
      setMessages([...messages, { role: 'user', content: msg }, { role: 'assistant', content: 'เชื่อมต่อไม่ได้ กรุณาลองใหม่' }]);
      setLoading(false);
      setStreaming('');
    }
  };

  return (
    <>
      {/* FAB — bottom right circle */}
      <button onClick={() => setOpen(!open)}
        className={`fixed z-40 flex items-center justify-center cursor-pointer border-none shadow-xl transition-all duration-300 rounded-full ${
          open ? 'bottom-5 right-[372px] w-10 h-10' : 'bottom-20 right-4 w-14 h-14'
        }`}
        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
        {open ? (
          <X size={18} color="#fff" />
        ) : (
          <div className="relative flex items-center justify-center">
            <span className="text-white text-[18px] font-black tracking-tight">AI</span>
            <Sparkles size={10} color="#fff" className="absolute -top-1.5 -right-2.5 opacity-80" />
          </div>
        )}
      </button>

      {/* Sidebar panel */}
      <div className={`fixed top-0 right-0 h-full w-[360px] z-30 flex flex-col transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
        style={{ background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}>
              <BotIcon size={20} />
            </div>
            <div>
              <div className="text-sm font-bold">RM AI</div>
              <div className="text-[10px] text-text-tertiary">ผู้ช่วยอ่านตัวเลขธุรกิจ</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-status-good animate-pulse" />
              <span className="text-[10px] text-status-good leading-none">พร้อมตอบ</span>
            </div>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])}
                className="text-[10px] text-text-tertiary cursor-pointer bg-transparent border-none hover:text-text-secondary">
                ล้างแชท
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !streaming && (
            <div className="py-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))' }}>
                  <BotIcon size={36} />
                </div>
                <div className="text-sm font-semibold mb-1">สวัสดีครับ RM AI พร้อมช่วย</div>
                <div className="text-xs text-text-secondary">ถามเรื่องตัวเลขธุรกิจ มุมมองธนาคาร</div>
              </div>
              <div className="space-y-2">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-text-primary cursor-pointer hover:border-[#6366F1] hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1"
                  style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <BotIcon size={16} />
                </div>
              )}
              <div className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-2xl rounded-br-md text-white'
                  : 'rounded-2xl rounded-bl-md bg-bg-secondary text-text-primary'
              }`}
                style={m.role === 'user' ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' } : {}}>
                {m.role === 'assistant' ? <MdMessage content={m.content} /> : m.content}
              </div>
            </div>
          ))}
          {/* Streaming message */}
          {streaming && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <BotIcon size={16} />
              </div>
              <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-bg-secondary text-text-primary text-sm leading-relaxed">
                <MdMessage content={streaming} />
                <span className="inline-block w-1.5 h-4 bg-text-tertiary animate-pulse ml-0.5 align-middle rounded-sm" />
              </div>
            </div>
          )}
          {/* Loading dots */}
          {loading && !streaming && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <BotIcon size={16} />
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-bg-secondary">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border shrink-0">
          <div className="flex items-center gap-2">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="ถามอะไรก็ได้..."
              disabled={loading}
              className="flex-1 h-10 rounded-xl border border-border px-3.5 text-sm bg-bg-card text-text-primary outline-none focus:border-[#6366F1] font-thai disabled:opacity-50" />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer border-none disabled:opacity-30 transition-all"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <Send size={16} color="#fff" />
            </button>
          </div>
          <div className="text-[9px] text-text-tertiary text-center mt-1.5">
            {messages.filter(m => m.role === 'user').length}/15 ข้อความ
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
