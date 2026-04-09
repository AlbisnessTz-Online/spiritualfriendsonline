import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Crown, Shield, User, BookOpen, CheckCircle2, Clock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type AppRole = 'admin' | 'chairperson' | 'treasurer' | 'secretary' | 'discipline_leader';

interface Invitation {
  id: string; email: string; role: AppRole; full_name: string;
  accepted: boolean; accepted_at: string | null; created_at: string;
}

const labels = {
  en: {
    title: 'Leaders', subtitle: 'Register group leaders and assign their roles',
    registerLeader: 'Register Leader', active: 'Active', pendingSignup: 'Pending signup',
    notAssigned: 'Not assigned', activeLeaders: 'Active Leaders',
    awaitingSignup: 'Awaiting Sign-up', pending: 'Pending',
    noLeaders: 'No leaders registered yet.', registerFirst: 'Register first leader',
    fullName: 'Full Name', email: 'Email Address', role: 'Role',
    howItWorks: 'How it works:', howItWorksDesc: 'Once registered, share the login page URL with this leader. When they sign up using this exact email address, they will automatically be assigned the',
    roleAutoSuffix: 'role.',
    cancel: 'Cancel', registerBtn: 'Register Leader',
    removeLeader: 'Remove Leader?', removeDesc: 'This will remove their registration.',
    remove: 'Remove', leaderRegistered: '✓ Leader registered!',
    leaderRemoved: 'Leader removed',
    tip: '💡 Registered leaders must sign up at the login page using their registered email. Their role will be assigned automatically.',
    admin: 'Admin', chairperson: 'Chairperson', treasurer: 'Mr. Treasurer',
    secretary: 'Secretary', disciplineLeader: 'Discipline Leader',
    adminDesc: 'Full system access', chairpersonDesc: 'Group chair & leader',
    treasurerDesc: 'Manages finances & contributions', secretaryDesc: 'Manages records & members',
    disciplineLeaderDesc: 'Maintains group discipline',
  },
  sw: {
    title: 'Viongozi', subtitle: 'Sajili viongozi wa kikundi na uwagawie majukumu',
    registerLeader: 'Sajili Kiongozi', active: 'Hai', pendingSignup: 'Inasubiri usajili',
    notAssigned: 'Hajagawiwa', activeLeaders: 'Viongozi Hai',
    awaitingSignup: 'Wanaosubiri Usajili', pending: 'Inasubiri',
    noLeaders: 'Hakuna viongozi waliosajiliwa bado.', registerFirst: 'Sajili kiongozi wa kwanza',
    fullName: 'Jina Kamili', email: 'Barua Pepe', role: 'Jukumu',
    howItWorks: 'Jinsi inavyofanya kazi:', howItWorksDesc: 'Baada ya kusajili, shiriki URL ya ukurasa wa kuingia na kiongozi huyu. Atakapojisajili kwa kutumia barua pepe hii, atapewa jukumu la',
    roleAutoSuffix: 'kiautomatiki.',
    cancel: 'Ghairi', registerBtn: 'Sajili Kiongozi',
    removeLeader: 'Ondoa Kiongozi?', removeDesc: 'Hii itaondoa usajili wao.',
    remove: 'Ondoa', leaderRegistered: '✓ Kiongozi amesajiliwa!',
    leaderRemoved: 'Kiongozi ameondolewa',
    tip: '💡 Viongozi waliosajiliwa lazima wajisajili kwenye ukurasa wa kuingia kwa kutumia barua pepe yao iliyosajiliwa.',
    admin: 'Msimamizi', chairperson: 'Mwenyekiti', treasurer: 'Mweka Hazina',
    secretary: 'Katibu', disciplineLeader: 'Kiongozi wa Nidhamu',
    adminDesc: 'Ufikiaji kamili wa mfumo', chairpersonDesc: 'Mwenyekiti & kiongozi wa kikundi',
    treasurerDesc: 'Anasimamia fedha na michango', secretaryDesc: 'Anasimamia kumbukumbu na wanachama',
    disciplineLeaderDesc: 'Anadumisha nidhamu ya kikundi',
  },
} as const;

export default function LeadersPage() {
  const { toast } = useToast();
  const { lang } = useAppTheme();
  const t = labels[lang];
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', full_name: '', role: 'treasurer' as AppRole });

  const ROLE_CONFIG: Record<AppRole, { label: string; icon: React.ElementType; color: string; description: string }> = {
    admin: { label: t.admin, icon: Shield, color: 'bg-primary text-primary-foreground', description: t.adminDesc },
    chairperson: { label: t.chairperson, icon: Crown, color: 'bg-accent text-accent-foreground', description: t.chairpersonDesc },
    treasurer: { label: t.treasurer, icon: User, color: 'bg-secondary text-secondary-foreground', description: t.treasurerDesc },
    secretary: { label: t.secretary, icon: BookOpen, color: 'bg-blue-500 text-white', description: t.secretaryDesc },
    discipline_leader: { label: t.disciplineLeader, icon: Shield, color: 'bg-purple-500 text-white', description: t.disciplineLeaderDesc },
  };

  const fetchInvitations = async () => {
    setLoading(true);
    const { data } = await supabase.from('leader_invitations').select('*').order('created_at', { ascending: false });
    setInvitations((data || []) as Invitation[]);
    setLoading(false);
  };

  useEffect(() => { fetchInvitations(); }, []);

  const handleRegister = async () => {
    if (!form.email || !form.full_name || !form.role) {
      toast({ title: t.cancel, variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('leader_invitations').upsert({
      email: form.email.toLowerCase(), full_name: form.full_name, role: form.role, accepted: false,
    }, { onConflict: 'email' });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: t.leaderRegistered, description: `${form.full_name} → ${ROLE_CONFIG[form.role].label}` });
      setDialogOpen(false);
      setForm({ email: '', full_name: '', role: 'treasurer' });
      fetchInvitations();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('leader_invitations').delete().eq('id', deleteId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: t.leaderRemoved }); fetchInvitations(); }
    setDeleteId(null);
  };

  const accepted = invitations.filter((i) => i.accepted);
  const pending = invitations.filter((i) => !i.accepted);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.subtitle}</p>
        </div>
        <Button onClick={() => { setForm({ email: '', full_name: '', role: 'treasurer' }); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> {t.registerLeader}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['chairperson', 'treasurer', 'secretary', 'discipline_leader'] as AppRole[]).map((role) => {
          const cfg = ROLE_CONFIG[role];
          const Icon = cfg.icon;
          const registered = invitations.find((i) => i.role === role);
          return (
            <div key={role} className="bg-card rounded-xl border border-border p-4 text-center">
              <div className={`w-10 h-10 rounded-full ${cfg.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="font-display font-semibold text-foreground text-sm">{cfg.label}</p>
              {registered ? (
                <div className="mt-1.5">
                  <p className="text-xs text-foreground/70 truncate">{registered.full_name}</p>
                  {registered.accepted
                    ? <span className="inline-flex items-center gap-1 text-xs text-secondary mt-1"><CheckCircle2 className="w-3 h-3" />{t.active}</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3" />{t.pendingSignup}</span>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">{t.notAssigned}</p>
              )}
            </div>
          );
        })}
      </div>

      {accepted.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
            <h2 className="font-display font-semibold text-foreground">{t.activeLeaders}</h2>
            <span className="ml-auto text-xs text-muted-foreground">{accepted.length}</span>
          </div>
          <div className="divide-y divide-border">
            {accepted.map((inv) => {
              const cfg = ROLE_CONFIG[inv.role];
              const Icon = cfg.icon;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-full ${cfg.color} flex items-center justify-center flex-shrink-0`}><Icon className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{inv.full_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <button onClick={() => setDeleteId(inv.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <h2 className="font-display font-semibold text-foreground">{t.awaitingSignup}</h2>
            <span className="ml-auto text-xs text-muted-foreground">{pending.length}</span>
          </div>
          <div className="divide-y divide-border">
            {pending.map((inv) => {
              const cfg = ROLE_CONFIG[inv.role];
              const Icon = cfg.icon;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-4 opacity-80">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{inv.full_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{cfg.label}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs bg-accent/15 text-accent-foreground font-medium">{t.pending}</span>
                  </div>
                  <button onClick={() => setDeleteId(inv.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 bg-muted/30 text-xs text-muted-foreground">{t.tip}</div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : invitations.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-16 text-center">
          <Crown className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">{t.noLeaders}</p>
          <Button onClick={() => setDialogOpen(true)}>{t.registerFirst}</Button>
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.registerLeader}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.fullName}</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Kamau" />
            </div>
            <div className="space-y-2">
              <Label>{t.email}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="leader@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{t.role}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chairperson">👑 {t.chairperson}</SelectItem>
                  <SelectItem value="treasurer">💰 {t.treasurer}</SelectItem>
                  <SelectItem value="secretary">📋 {t.secretary}</SelectItem>
                  <SelectItem value="discipline_leader">🛡️ {t.disciplineLeader}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <strong>{t.howItWorks}</strong> {t.howItWorksDesc} <strong>{ROLE_CONFIG[form.role].label}</strong> {t.roleAutoSuffix}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleRegister} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.registerBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.removeLeader}</AlertDialogTitle>
            <AlertDialogDescription>{t.removeDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.remove}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}