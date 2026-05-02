import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Loader2, Cross, Trash2 } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

const labels = {
  en: {
    title: 'Spiritual Assistant',
    subtitle: 'Ask anything about the Bible, faith, prayer, or life — your AI spiritual companion.',
    placeholder: 'Type your question…  e.g. "What does Romans 8:28 mean?"',
    send: 'Send', clear: 'Clear chat',
    welcome: '🙏 Karibu! I\'m here to walk with you in faith. Ask about Scripture, prayer, struggles, or anything spiritual.',
    suggestions: ['What does the Bible say about anxiety?', 'How can I pray when I don\'t feel God?', 'Explain John 3:16 to me'],
    error: 'Could not reach the assistant',
  },
  sw: {
    title: 'Msaidizi wa Kiroho',
    subtitle: 'Uliza chochote kuhusu Biblia, imani, sala au maisha — rafiki yako wa kiroho wa AI.',
    placeholder: 'Andika swali lako…  k.m. "Warumi 8:28 inamaanisha nini?"',
    send: 'Tuma', clear: 'Futa mazungumzo',
    welcome: '🙏 Karibu! Niko hapa kutembea nawe katika imani. Niulize kuhusu Maandiko, sala, changamoto au jambo lolote la kiroho.',
    suggestions: ['Biblia inasema nini kuhusu wasiwasi?', 'Niombeje wakati simhisi Mungu?', 'Nielezee Yohana 3:16'],
    error: 'Imeshindikana kufikia msaidizi',
  },
} as const;

const STORAGE_KEY = 'spiritual-assistant-history-v1';

export default function AssistantPage() {
  const { lang } = useAppTheme();
  const { toast } = useToast();
  const t = labels[lang];
  const [messages, setMessages] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    const userMsg: Msg = { role: 'user', content };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spiritual-assistant`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let assistantText = '';
      setMessages(curr => [...curr, { role: 'assistant', content: '' }]);

      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages(curr => curr.map((m, i) => i === curr.length - 1 ? { ...m, content: assistantText } : m));
            }
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: t.error, description: e?.message ?? String(e), variant: 'destructive' });
      setMessages(curr => curr.filter((_, i) => i !== curr.length - 1 || curr[i].role !== 'assistant' || curr[i].content !== ''));
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setMessages([]); localStorage.removeItem(STORAGE_KEY); };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-3rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground">{t.title}</h1>
            <p className="text-xs text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground gap-1">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t.clear}</span>
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
              <Cross className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground max-w-md mb-6">{t.welcome}</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {t.suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-2 text-xs rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border text-foreground rounded-bl-sm'
            }`}>
              {m.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2">
                  <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-card border border-border">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border pt-3">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t.placeholder}
            rows={1}
            className="resize-none min-h-[44px] max-h-32"
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="h-11 w-11 flex-shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}