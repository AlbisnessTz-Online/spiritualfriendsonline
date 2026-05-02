import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Mail, Search, Trash2, Send, BookOpen, Megaphone, CheckCircle2, Clock, Users } from 'lucide-react';

interface Subscriber {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  subscribed_daily_prayer: boolean;
  subscribed_announcements: boolean;
  is_verified: boolean;
  joined_at: string;
}

const labels = {
  en: {
    title: 'Subscribers', subtitle: 'Manage email subscribers and trigger daily prayer broadcasts.',
    search: 'Search by name, email or phone…',
    total: 'Total', verified: 'Verified', dailyPrayer: 'Daily Prayer', announcements: 'Announcements',
    sendNow: 'Send today\'s prayer now', sending: 'Sending…', noSubs: 'No subscribers yet.',
    joined: 'Joined', remove: 'Remove subscriber?', removeDesc: 'They will no longer receive any emails. This cannot be undone.',
    cancel: 'Cancel', confirmRemove: 'Remove',
    updated: 'Updated', removed: 'Subscriber removed', sentTitle: '✓ Daily prayer dispatched',
    sentDesc: (n: number) => `Sent to ${n} subscriber(s).`,
    noPrayerToday: 'No active prayer is set for today yet.',
    pending: 'Pending', verifiedBadge: 'Verified',
  },
  sw: {
    title: 'Wajiandikishaji', subtitle: 'Simamia wajiandikishaji wa barua pepe na tuma maombi ya leo.',
    search: 'Tafuta kwa jina, barua pepe au simu…',
    total: 'Jumla', verified: 'Waliothibitishwa', dailyPrayer: 'Sala ya Kila Siku', announcements: 'Matangazo',
    sendNow: 'Tuma sala ya leo sasa', sending: 'Inatuma…', noSubs: 'Hakuna wajiandikishaji bado.',
    joined: 'Alijiunga', remove: 'Ondoa mjiandikishaji?', removeDesc: 'Hatapata barua pepe tena. Hii haiwezi kutenduliwa.',
    cancel: 'Ghairi', confirmRemove: 'Ondoa',
    updated: 'Imesasishwa', removed: 'Mjiandikishaji ameondolewa', sentTitle: '✓ Sala ya leo imetumwa',
    sentDesc: (n: number) => `Imetumwa kwa wajiandikishaji ${n}.`,
    noPrayerToday: 'Hakuna sala iliyowekwa kwa leo bado.',
    pending: 'Inasubiri', verifiedBadge: 'Imethibitishwa',
  },
} as const;

export default function SubscribersPage() {
  const { lang } = useAppTheme();
  const { toast } = useToast();
  const t = labels[lang];
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [toRemove, setToRemove] = useState<Subscriber | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('member_subscribers')
      .select('*')
      .order('joined_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSubs(data as Subscriber[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePref = async (s: Subscriber, field: 'subscribed_daily_prayer' | 'subscribed_announcements', value: boolean) => {
    const prev = subs;
    setSubs(curr => curr.map(x => x.id === s.id ? { ...x, [field]: value } : x));
    const update = field === 'subscribed_daily_prayer'
      ? { subscribed_daily_prayer: value }
      : { subscribed_announcements: value };
    const { error } = await supabase.from('member_subscribers').update(update).eq('id', s.id);
    if (error) {
      setSubs(prev);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t.updated });
    }
  };

  const remove = async (s: Subscriber) => {
    const { error } = await supabase.from('member_subscribers').delete().eq('id', s.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSubs(curr => curr.filter(x => x.id !== s.id));
      toast({ title: t.removed });
    }
    setToRemove(null);
  };

  const sendDailyPrayer = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-prayer');
      if (error) throw error;
      if (data?.success === false && data?.message) {
        toast({ title: t.noPrayerToday, description: data.message });
      } else {
        toast({ title: t.sentTitle, description: t.sentDesc(data?.sent ?? 0) });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? String(e), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const filtered = subs.filter(s => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return s.full_name.toLowerCase().includes(q)
      || s.email.toLowerCase().includes(q)
      || (s.phone_number ?? '').toLowerCase().includes(q);
  });

  const stats = {
    total: subs.length,
    verified: subs.filter(s => s.is_verified).length,
    daily: subs.filter(s => s.subscribed_daily_prayer).length,
    announce: subs.filter(s => s.subscribed_announcements).length,
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
        </div>
        <Button onClick={sendDailyPrayer} disabled={sending} className="gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? t.sending : t.sendNow}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t.total, value: stats.total, icon: Users, color: 'text-blue-500' },
          { label: t.verified, value: stats.verified, icon: CheckCircle2, color: 'text-green-500' },
          { label: t.dailyPrayer, value: stats.daily, icon: BookOpen, color: 'text-purple-500' },
          { label: t.announcements, value: stats.announce, icon: Megaphone, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t.search}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/50">
          <Mail className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">{t.noSubs}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground truncate">{s.full_name}</p>
                  {s.is_verified ? (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                      <CheckCircle2 className="w-3 h-3" />{t.verifiedBadge}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                      <Clock className="w-3 h-3" />{t.pending}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{s.email}</p>
                {s.phone_number && <p className="text-xs text-muted-foreground">{s.phone_number}</p>}
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {t.joined}: {new Date(s.joined_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-4 lg:gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Switch
                    checked={s.subscribed_daily_prayer}
                    onCheckedChange={(v) => togglePref(s, 'subscribed_daily_prayer', v)}
                  />
                  <span className="text-muted-foreground hidden sm:inline">{t.dailyPrayer}</span>
                  <BookOpen className="w-4 h-4 sm:hidden text-purple-500" />
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Switch
                    checked={s.subscribed_announcements}
                    onCheckedChange={(v) => togglePref(s, 'subscribed_announcements', v)}
                  />
                  <span className="text-muted-foreground hidden sm:inline">{t.announcements}</span>
                  <Megaphone className="w-4 h-4 sm:hidden text-amber-500" />
                </label>
                <Button variant="ghost" size="icon" onClick={() => setToRemove(s)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.remove}</AlertDialogTitle>
            <AlertDialogDescription>{t.removeDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => toRemove && remove(toRemove)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.confirmRemove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}