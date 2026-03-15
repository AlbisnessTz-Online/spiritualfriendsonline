import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit2, Trash2, Loader2, X } from 'lucide-react';
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

interface Member {
  id: string;
  full_name: string;
  phone_number: string;
  gender: string;
  join_date: string;
}

const emptyForm = { full_name: '', phone_number: '', gender: 'Male', join_date: new Date().toISOString().split('T')[0] };

export default function MembersPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
    if (!error) setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const openAdd = () => { setEditingMember(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: Member) => { setEditingMember(m); setForm({ full_name: m.full_name, phone_number: m.phone_number, gender: m.gender, join_date: m.join_date }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.full_name || !form.phone_number || !form.gender) {
      toast({ title: 'Validation error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    if (editingMember) {
      const { error } = await supabase.from('members').update(form).eq('id', editingMember.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Member updated' }); setDialogOpen(false); fetchMembers(); }
    } else {
      const { error } = await supabase.from('members').insert({ ...form });
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Member added' }); setDialogOpen(false); fetchMembers(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('members').delete().eq('id', deleteId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Member deleted' }); fetchMembers(); }
    setDeleteId(null);
  };

  const filtered = members.filter(
    (m) => m.full_name.toLowerCase().includes(search.toLowerCase()) || m.phone_number.includes(search)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">{members.length} registered member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Member
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No members found.</p>
            <Button variant="outline" className="mt-4" onClick={openAdd}>Add first member</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gender</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m, i) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 text-muted-foreground text-sm">{i + 1}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{m.full_name}</td>
                    <td className="px-5 py-3.5 text-foreground text-sm">{m.phone_number}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${m.gender === 'Male' ? 'bg-blue-100 text-blue-700' : m.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-muted text-muted-foreground'}`}>
                        {m.gender}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-sm">{m.join_date}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(m.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Enter full name" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="07XXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Join Date</Label>
              <Input type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
