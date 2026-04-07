import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Trash2, Loader2, X, Filter } from 'lucide-react';

const labels = {
  en: {
    title: 'Transactions', transaction: 'transaction', transactions: 'transactions',
    total: 'Total', liveRefresh: 'Live refresh every 5 seconds', lastChecked: 'Last checked',
    addTx: 'Add Transaction', searchPlaceholder: 'Search by name, phone, or transaction ID...',
    noTx: 'No transactions found.', addFirst: 'Add first transaction',
    memberName: 'Member Name', phone: 'Phone', amount: 'Amount (TSh)',
    txId: 'Transaction ID', date: 'Date', source: 'Source',
    fullName: 'Full name', notes: 'Notes (optional)', monthlyContrib: 'Monthly contribution...',
    cancel: 'Cancel', save: 'Save', deleteTx: 'Delete Transaction?',
    deleteDesc: 'This cannot be undone.', delete: 'Delete',
    smsImport: 'SMS Import', manual: 'Manual',
    txAdded: 'Transaction added', txDeleted: 'Transaction deleted',
    validationError: 'Validation error', requiredMissing: 'Required fields are missing.',
  },
  sw: {
    title: 'Miamala', transaction: 'muamala', transactions: 'miamala',
    total: 'Jumla', liveRefresh: 'Upya otomatiki kila sekunde 5', lastChecked: 'Mara ya mwisho',
    addTx: 'Ongeza Muamala', searchPlaceholder: 'Tafuta kwa jina, simu, au kitambulisho...',
    noTx: 'Hakuna miamala.', addFirst: 'Ongeza muamala wa kwanza',
    memberName: 'Jina la Mwanachama', phone: 'Simu', amount: 'Kiasi (TSh)',
    txId: 'Kitambulisho cha Muamala', date: 'Tarehe', source: 'Chanzo',
    fullName: 'Jina kamili', notes: 'Maelezo (si lazima)', monthlyContrib: 'Mchango wa kila mwezi...',
    cancel: 'Ghairi', save: 'Hifadhi', deleteTx: 'Futa Muamala?',
    deleteDesc: 'Hatua hii haiwezi kutendwa tena.', delete: 'Futa',
    smsImport: 'Ingizo la SMS', manual: 'Mkono',
    txAdded: 'Muamala umeongezwa', txDeleted: 'Muamala umefutwa',
    validationError: 'Hitilafu ya uthibitishaji', requiredMissing: 'Sehemu zinazohitajika hazipo.',
  },
} as const;
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

interface Transaction {
  id: string;
  member_name: string;
  phone_number: string;
  amount: number;
  transaction_id: string;
  transaction_date: string;
  notes: string | null;
  source: string;
}

const emptyForm = {
  member_name: '', phone_number: '', amount: '', transaction_id: '',
  transaction_date: new Date().toISOString().split('T')[0], notes: '',
};

export default function TransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);

    let query = supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
    if (dateFrom) query = query.gte('transaction_date', dateFrom);
    if (dateTo) query = query.lte('transaction_date', dateTo);
    const { data, error } = await query;
    if (!error) setTransactions(data || []);
    setLastUpdated(new Date().toLocaleTimeString());
    if (background) setRefreshing(false);
    else setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
    const interval = window.setInterval(() => {
      fetchTransactions(true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [fetchTransactions]);

  const handleSave = async () => {
    if (!form.member_name || !form.phone_number || !form.amount || !form.transaction_id) {
      toast({ title: 'Validation error', description: 'Required fields are missing.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('transactions').insert({
      member_name: form.member_name, phone_number: form.phone_number,
      amount: Number(form.amount), transaction_id: form.transaction_id,
      transaction_date: form.transaction_date, notes: form.notes || null,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Transaction added' }); setDialogOpen(false); fetchTransactions(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('transactions').delete().eq('id', deleteId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Transaction deleted' }); fetchTransactions(); }
    setDeleteId(null);
  };

  const filtered = transactions.filter(
    (t) => t.member_name.toLowerCase().includes(search.toLowerCase()) ||
      t.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
      t.phone_number.includes(search)
  );

  const total = filtered.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''} · Total: <span className="font-semibold text-secondary">TSh {total.toLocaleString()}</span></p>
          <p className="text-xs text-muted-foreground mt-1">Live refresh every 5 seconds{lastUpdated ? ` · Last checked ${lastUpdated}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, phone, or transaction ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input type="date" className="w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
          <span className="text-muted-foreground text-sm">–</span>
          <Input type="date" className="w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No transactions found.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>Add first transaction</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {['Member Name', 'Phone', 'Amount (TSh)', 'Transaction ID', 'Date', 'Source', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{tx.member_name}</td>
                    <td className="px-5 py-3.5 text-foreground text-sm">{tx.phone_number}</td>
                    <td className="px-5 py-3.5 text-secondary font-semibold">{Number(tx.amount).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-sm font-mono">{tx.transaction_id}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-sm">{tx.transaction_date}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.source === 'sms_import' ? 'bg-accent/15 text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {tx.source === 'sms_import' ? 'SMS Import' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setDeleteId(tx.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Member Name</Label>
                <Input value={form.member_name} onChange={(e) => setForm({ ...form, member_name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="07XXXXXXXX" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (TSh)</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500" />
              </div>
              <div className="space-y-2">
                <Label>Transaction ID</Label>
                <Input value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} placeholder="QAZ1234567" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Monthly contribution..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
