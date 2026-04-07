import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Loader2, BookOpen, Star, Sparkles, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const labels = {
  en: {
    title: 'Daily Prayers', subtitle: "Manage the group's daily prayer messages",
    autoGenerate: 'Auto-Generate (KkkT)', generating: 'Generating...',
    addPrayer: 'Add Prayer', todayActive: "Today's Active Prayer · KkkT Calendar",
    share: 'Share', active: 'Active', noPrayers: 'No prayers yet.',
    addFirst: 'Add first prayer', editPrayer: 'Edit Prayer',
    prayerTitle: 'Title', titlePlaceholder: 'Prayer title...',
    prayerDate: 'Prayer Date', prayerContent: 'Prayer Content',
    contentPlaceholder: 'Write the prayer message here...',
    setActive: "Set as today's active prayer",
    cancel: 'Cancel', saveChanges: 'Save Changes',
    deletePrayer: 'Delete Prayer?', deleteDesc: 'This action cannot be undone.',
    delete: 'Delete', prayerUpdated: 'Prayer updated', prayerAdded: 'Prayer added',
    prayerDeleted: 'Prayer deleted', prayerGenerated: '✨ Prayer generated!',
    alreadySet: 'Prayer already set for today', editBelow: 'Edit it below if needed.',
    genFailed: 'Generation failed', tryAgain: 'Try again',
    validationError: 'Validation error', titleContentRequired: 'Title and content are required.',
  },
  sw: {
    title: 'Sala za Kila Siku', subtitle: 'Simamia ujumbe wa sala za kila siku za kikundi',
    autoGenerate: 'Tengeneza Otomatiki (KkkT)', generating: 'Inatengeneza...',
    addPrayer: 'Ongeza Sala', todayActive: 'Sala ya Leo · Kalenda ya KkkT',
    share: 'Shiriki', active: 'Hai', noPrayers: 'Hakuna sala bado.',
    addFirst: 'Ongeza sala ya kwanza', editPrayer: 'Hariri Sala',
    prayerTitle: 'Kichwa', titlePlaceholder: 'Kichwa cha sala...',
    prayerDate: 'Tarehe ya Sala', prayerContent: 'Maudhui ya Sala',
    contentPlaceholder: 'Andika ujumbe wa sala hapa...',
    setActive: 'Weka kama sala hai ya leo',
    cancel: 'Ghairi', saveChanges: 'Hifadhi Mabadiliko',
    deletePrayer: 'Futa Sala?', deleteDesc: 'Hatua hii haiwezi kutendwa tena.',
    delete: 'Futa', prayerUpdated: 'Sala imesasishwa', prayerAdded: 'Sala imeongezwa',
    prayerDeleted: 'Sala imefutwa', prayerGenerated: '✨ Sala imetengenezwa!',
    alreadySet: 'Sala imeshawekwa kwa leo', editBelow: 'Hariri hapa chini ikihitajika.',
    genFailed: 'Utengenezaji umeshindikana', tryAgain: 'Jaribu tena',
    validationError: 'Hitilafu ya uthibitishaji', titleContentRequired: 'Kichwa na maudhui vinahitajika.',
  },
} as const;

interface Prayer {
  id: string; title: string; content: string; prayer_date: string; is_active: boolean;
}

const emptyForm = {
  title: '', content: '',
  prayer_date: new Date().toISOString().split('T')[0],
  is_active: false,
};

export default function PrayersPage() {
  const { toast } = useToast();
  const { lang } = useAppTheme();
  const t = labels[lang];
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);

  const generateTodaysPrayer = async () => {
    setGenerating(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/auto-daily-prayer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({ source: 'manual' }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t.prayerGenerated, description: data.title });
        fetchPrayers();
      } else if (data.message?.includes('already exists')) {
        toast({ title: t.alreadySet, description: t.editBelow });
      } else {
        toast({ title: t.genFailed, description: data.error || t.tryAgain, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    }
    setGenerating(false);
  };

  const fetchPrayers = async () => {
    setLoading(true);
    const { data } = await supabase.from('prayers').select('*').order('prayer_date', { ascending: false });
    setPrayers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPrayers(); }, []);

  const openAdd = () => { setEditingPrayer(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Prayer) => {
    setEditingPrayer(p);
    setForm({ title: p.title, content: p.content, prayer_date: p.prayer_date, is_active: p.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) {
      toast({ title: t.validationError, description: t.titleContentRequired, variant: 'destructive' });
      return;
    }
    setSaving(true);
    if (editingPrayer) {
      const { error } = await supabase.from('prayers').update(form).eq('id', editingPrayer.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else { toast({ title: t.prayerUpdated }); setDialogOpen(false); fetchPrayers(); }
    } else {
      const { error } = await supabase.from('prayers').insert(form);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else { toast({ title: t.prayerAdded }); setDialogOpen(false); fetchPrayers(); }
    }
    setSaving(false);
  };

  const toggleActive = async (p: Prayer) => {
    const { error } = await supabase.from('prayers').update({ is_active: !p.is_active }).eq('id', p.id);
    if (!error) fetchPrayers();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('prayers').delete().eq('id', deleteId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: t.prayerDeleted }); fetchPrayers(); }
    setDeleteId(null);
  };

  const todayPrayer = prayers.find((p) => p.prayer_date === new Date().toISOString().split('T')[0] && p.is_active);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={generateTodaysPrayer} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? t.generating : t.autoGenerate}
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> {t.addPrayer}
          </Button>
        </div>
      </div>

      {todayPrayer && (
        <div className="rounded-2xl p-6 bg-gradient-to-br from-primary to-secondary">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-primary-foreground/80 text-xs font-semibold uppercase tracking-wide">{t.todayActive}</span>
              </div>
              <h2 className="text-primary-foreground font-display font-bold text-xl mb-3">{todayPrayer.title}</h2>
              <p className="text-primary-foreground/85 leading-relaxed whitespace-pre-line">{todayPrayer.content}</p>
            </div>
            <button
              onClick={() => {
                const text = `🙏 *${todayPrayer.title}*\n\n${todayPrayer.content}\n\n_KkkT · ${todayPrayer.prayer_date}_`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              title="Share on WhatsApp"
              className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-primary-foreground text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              {t.share}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : prayers.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-16 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">{t.noPrayers}</p>
          <Button onClick={openAdd}>{t.addFirst}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {prayers.map((p) => (
            <div key={p.id} className={`bg-card rounded-xl border p-5 transition-all ${p.is_active ? 'border-primary/40 shadow-sm' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-foreground truncate">{p.title}</h3>
                    {p.is_active && (
                      <span className="flex-shrink-0 px-2 py-0.5 bg-secondary/15 text-secondary text-xs font-medium rounded-full">{t.active}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">{p.prayer_date}</p>
                  <p className="text-foreground/80 text-sm leading-relaxed line-clamp-3">{p.content}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`p-1.5 rounded-lg transition-colors ${p.is_active ? 'text-secondary hover:bg-secondary/10' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Star className={`w-4 h-4 ${p.is_active ? 'fill-secondary' : ''}`} />
                  </button>
                  <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPrayer ? t.editPrayer : t.addPrayer}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.prayerTitle}</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t.titlePlaceholder} />
            </div>
            <div className="space-y-2">
              <Label>{t.prayerDate}</Label>
              <Input type="date" value={form.prayer_date} onChange={(e) => setForm({ ...form, prayer_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.prayerContent}</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder={t.contentPlaceholder} rows={6} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-primary" />
              <Label htmlFor="active" className="cursor-pointer">{t.setActive}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPrayer ? t.saveChanges : t.addPrayer}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deletePrayer}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}