import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Copy, CheckCheck, Smartphone, Wifi, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const labels = {
  en: {
    title: 'Auto SMS Import', subtitle: 'Connect your Android phone to automatically send M-Pesa transactions to this system',
    howItWorks: 'How it works',
    step1: 'Install an SMS forwarder app on the Android phone that receives M-Pesa SMS messages',
    step2: 'Configure the app to forward SMS from "MPESA" sender to this webhook URL',
    step3: 'Every M-KOBA/M-Pesa contribution SMS will be automatically parsed and saved to transactions',
    webhookUrl: 'Your Webhook URL', copyUrl: 'Copy this URL and paste it into your SMS forwarder app as the forwarding destination:',
    copied: 'Copied to clipboard!',
    recommendedApps: 'Recommended SMS Forwarder Apps', appConfigTips: 'App configuration tips:',
    recentlyImported: 'Recently Auto-Imported', autoRefresh: 'Auto-refreshes every 5 seconds',
    lastChecked: 'Last checked', refresh: 'Refresh',
    noAutoImported: 'No auto-imported transactions yet. Once your phone forwards an M-Pesa SMS, it will appear here.',
    incomingSmsActivity: 'Incoming SMS Activity',
    incomingSmsDesc: 'Every SMS that reaches the webhook appears here, even when parsing fails.',
    noSmsReceived: 'No SMS has reached the webhook yet.',
    parsedOk: 'Parsed OK', failedParse: 'Failed to parse', reason: 'Reason',
  },
  sw: {
    title: 'Ingiza SMS Otomatiki', subtitle: 'Unganisha simu yako ya Android kutuma miamala ya M-Pesa kiautomatiki kwenye mfumo huu',
    howItWorks: 'Jinsi inavyofanya kazi',
    step1: 'Sakinisha programu ya kusambaza SMS kwenye simu ya Android inayopokea ujumbe wa M-Pesa',
    step2: 'Sanidi programu kusambaza SMS kutoka "MPESA" hadi URL hii ya webhook',
    step3: 'Kila SMS ya mchango wa M-KOBA/M-Pesa itachambuliwa na kuhifadhiwa kwenye miamala kiautomatiki',
    webhookUrl: 'URL Yako ya Webhook', copyUrl: 'Nakili URL hii na uibandike kwenye programu yako ya kusambaza SMS:',
    copied: 'Imenakiliwa!',
    recommendedApps: 'Programu Zinazopendekezwa za Kusambaza SMS', appConfigTips: 'Vidokezo vya usanidi:',
    recentlyImported: 'Zilizoingizwa Hivi Karibuni', autoRefresh: 'Upya otomatiki kila sekunde 5',
    lastChecked: 'Mara ya mwisho', refresh: 'Sasisha',
    noAutoImported: 'Hakuna miamala iliyoingizwa kiautomatiki bado.',
    incomingSmsActivity: 'Shughuli za SMS Zinazoingia',
    incomingSmsDesc: 'Kila SMS inayofika kwenye webhook inaonekana hapa, hata uchambuzi ukishindikana.',
    noSmsReceived: 'Hakuna SMS iliyofika kwenye webhook bado.',
    parsedOk: 'Imechambuliwa', failedParse: 'Uchambuzi umeshindikana', reason: 'Sababu',
  },
} as const;

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] ?? '';
const WEBHOOK_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mpesa-sms-webhook`;

interface RecentTx { id: string; transaction_id: string; member_name: string; amount: number; transaction_date: string; created_at: string; }
interface SmsLog { id: string; raw_body: string; parsed_ok: boolean; error_reason: string | null; created_at: string; }

export default function SmsWebhookPage() {
  const { toast } = useToast();
  const { lang } = useAppTheme();
  const t = labels[lang];
  const [copied, setCopied] = useState<string | null>(null);
  const [recentTx, setRecentTx] = useState<RecentTx[]>([]);
  const [recentLogs, setRecentLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: t.copied });
    setTimeout(() => setCopied(null), 2000);
  };

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    const [transactionsRes, logsRes] = await Promise.all([
      supabase.from('transactions').select('id, transaction_id, member_name, amount, transaction_date, created_at').eq('source', 'sms_import').order('created_at', { ascending: false }).limit(10),
      supabase.from('sms_logs').select('id, raw_body, parsed_ok, error_reason, created_at').order('created_at', { ascending: false }).limit(10),
    ]);
    setRecentTx(transactionsRes.data || []);
    setRecentLogs(logsRes.data || []);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecent();
    const interval = window.setInterval(() => fetchRecent(), 5000);
    return () => window.clearInterval(interval);
  }, [fetchRecent]);

  const CopyButton = ({ text, copyKey }: { text: string; copyKey: string }) => (
    <button onClick={() => copyToClipboard(text, copyKey)} className="flex-shrink-0 p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
      {copied === copyKey ? <CheckCheck className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.subtitle}</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" /> {t.howItWorks}
        </h2>
        <div className="space-y-3">
          {[{ step: '1', text: t.step1 }, { step: '2', text: t.step2 }, { step: '3', text: t.step3 }].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
              <p className="text-foreground/80 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Wifi className="w-5 h-5 text-secondary" /> {t.webhookUrl}
        </h2>
        <p className="text-sm text-muted-foreground">{t.copyUrl}</p>
        <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
          <code className="text-xs text-foreground flex-1 break-all">{WEBHOOK_URL}</code>
          <CopyButton text={WEBHOOK_URL} copyKey="webhook" />
        </div>

        <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-xs text-foreground/80 space-y-1">
              <p><strong>Request format:</strong> POST with JSON or form-data containing the SMS text in fields like <code className="bg-muted px-1 rounded">message</code>, <code className="bg-muted px-1 rounded">smsText</code>, <code className="bg-muted px-1 rounded">body</code>, or <code className="bg-muted px-1 rounded">text</code></p>
              <p><strong>Content-Type:</strong> <code className="bg-muted px-1 rounded">application/json</code> or <code className="bg-muted px-1 rounded">application/x-www-form-urlencoded</code></p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display font-semibold text-foreground mb-4">{t.recommendedApps}</h2>
        <div className="space-y-3">
          {[
            { name: 'SMS Forwarder', desc: 'Simple & free. Filter by sender (MPESA). Supports HTTP POST webhooks.', url: 'https://play.google.com/store/search?q=sms+forwarder+webhook&c=apps' },
            { name: 'SMS to URL Forwarder', desc: 'Forwards SMS to a custom URL. Set sender filter to "MPESA" for selective forwarding.', url: 'https://play.google.com/store/search?q=sms+to+url+forwarder&c=apps' },
            { name: 'AutoForward SMS', desc: 'Feature-rich forwarder with keyword filtering and webhook support.', url: 'https://play.google.com/store/search?q=autoforward+sms&c=apps' },
          ].map((app) => (
            <div key={app.name} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{app.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{app.desc}</p>
              </div>
              <a href={app.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
          <p><strong>{t.appConfigTips}</strong></p>
          <p>• Set method to: <code className="bg-muted px-1 rounded">POST</code></p>
          <p>• Use a body field name like: <code className="bg-muted px-1 rounded">message</code>, <code className="bg-muted px-1 rounded">smsText</code>, or <code className="bg-muted px-1 rounded">body</code></p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-semibold text-foreground">{t.recentlyImported}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t.autoRefresh}{lastUpdated ? ` · ${t.lastChecked} ${lastUpdated}` : ''}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchRecent} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t.refresh}
          </Button>
        </div>
        {recentTx.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">{t.noAutoImported}</div>
        ) : (
          <div className="divide-y divide-border">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-foreground text-sm">{tx.member_name}</p>
                  <p className="text-xs text-muted-foreground">{tx.transaction_id} · {tx.transaction_date}</p>
                </div>
                <span className="text-secondary font-semibold">TSh {Number(tx.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground">{t.incomingSmsActivity}</h2>
          <p className="text-xs text-muted-foreground mt-1">{t.incomingSmsDesc}</p>
        </div>
        {recentLogs.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm px-5">{t.noSmsReceived}</div>
        ) : (
          <div className="divide-y divide-border">
            {recentLogs.map((log) => (
              <div key={log.id} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${log.parsed_ok ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                      {log.parsed_ok ? t.parsedOk : t.failedParse}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground break-words leading-relaxed">{log.raw_body}</p>
                {!log.parsed_ok && log.error_reason && (
                  <p className="text-xs text-destructive">{t.reason}: {log.error_reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}