import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Crown, Shield, User, BookOpen, CheckCircle2, Clock } from 'lucide-react';
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
  id: string;
  email: string;
  role: AppRole;
  full_name: string;
  accepted: boolean;
  accepted_at: string | null;
  created_at: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: React.ElementType; color: string; description: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-primary text-primary-foreground', description: 'Full system access' },
  chairperson: { label: 'Chairperson', icon: Crown, color: 'bg-accent text-accent-foreground', description: 'Group chair & leader' },
  treasurer: { label: 'Mr. Treasurer', icon: User, color: 'bg-secondary text-secondary-foreground', description: 'Manages finances & contributions' },
  secretary: { label: 'Secretary', icon: BookOpen, color: 'bg-blue-500 text-white', description: 'Manages records & members' },
  discipline_leader: { label: 'Discipline Leader', icon: Shield, color: 'bg-purple-500 text-white', description: 'Maintains group discipline' },
};

const emptyForm = { email: '', full_name: '', role: 'treasurer' as AppRole };

export default function LeadersPage() {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchInvitations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leader_invitations')
      .select('*')
      .order('created_at', { ascending: false });
    setInvitations((data || []) as Invitation[]);
    setLoading(false);
  };

  useEffect(() => { fetchInvitations(); }, []);

  const handleRegister = async () => {
    if (!form.email || !form.full_name || !form.role) {
      toast({ title: 'All fields are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('leader_invitations').upsert({
      email: form.email.toLowerCase(),
      full_name: form.full_name,
      role: form.role,
      accepted: false,
    }, { onConflict: 'email' });

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: '✓ Leader registered!', description: `${form.full_name} can now sign up with ${form.email} and will be assigned the ${ROLE_CONFIG[form.role].label} role automatically.` });
      setDialogOpen(false);
      setForm(emptyForm);
      fetchInvitations();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('leader_invitations').delete().eq('id', deleteId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Leader removed' }); fetchInvitations(); }
    setDeleteId(null);
  };

  const accepted = invitations.filter((i) => i.accepted);
  const pending = invitations.filter((i) => !i.accepted);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Leaders</h1>
          <p className="text-muted-foreground text-sm mt-1">Register group leaders and assign their roles</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Register Leader
        </Button>
      </div>

      {/* Role cards overview */}
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
                    ? <span className="inline-flex items-center gap-1 text-xs text-secondary mt-1"><CheckCircle2 className="w-3 h-3" />Active</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3" />Pending signup</span>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Not assigned</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Active leaders */}
      {accepted.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
            <h2 className="font-display font-semibold text-foreground">Active Leaders</h2>
            <span className="ml-auto text-xs text-muted-foreground">{accepted.length}</span>
          </div>
          <div className="divide-y divide-border">
            {accepted.map((inv) => {
              const cfg = ROLE_CONFIG[inv.role];
              const Icon = cfg.icon;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-full ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
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

      {/* Pending registrations */}
      {pending.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <h2 className="font-display font-semibold text-foreground">Awaiting Sign-up</h2>
            <span className="ml-auto text-xs text-muted-foreground">{pending.length}</span>
          </div>
          <div className="divide-y divide-border">
            {pending.map((inv) => {
              const cfg = ROLE_CONFIG[inv.role];
              const Icon = cfg.icon;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-4 opacity-80">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{inv.full_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{cfg.label}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs bg-accent/15 text-accent-foreground font-medium">Pending</span>
                  </div>
                  <button onClick={() => setDeleteId(inv.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 bg-muted/30 text-xs text-muted-foreground">
            💡 Registered leaders must sign up at the login page using their registered email. Their role will be assigned automatically.
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : invitations.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-16 text-center">
          <Crown className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No leaders registered yet.</p>
          <Button onClick={() => setDialogOpen(true)}>Register first leader</Button>
        </div>
      ) : null}

      {/* Register Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Leader</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Kamau" />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="leader@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chairperson">👑 Chairperson</SelectItem>
                  <SelectItem value="treasurer">💰 Mr. Treasurer</SelectItem>
                  <SelectItem value="secretary">📋 Secretary</SelectItem>
                  <SelectItem value="discipline_leader">🛡️ Discipline Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <strong>How it works:</strong> Once registered, share the login page URL with this leader. When they sign up using this exact email address, they will automatically be assigned the <strong>{ROLE_CONFIG[form.role].label}</strong> role.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRegister} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Register Leader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Leader?</AlertDialogTitle>
            <AlertDialogDescription>This will remove their registration. If they have already signed up, their account will remain but their role may need to be reassigned.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
