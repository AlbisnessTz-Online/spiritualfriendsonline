import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, TrendingUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyReport {
  month: string;
  total: number;
  count: number;
}

interface MemberReport {
  member_name: string;
  phone_number: string;
  total: number;
  count: number;
  transactions: Array<{ transaction_date: string; amount: number; transaction_id: string }>;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);
  const [memberData, setMemberData] = useState<MemberReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState<'monthly' | 'members'>('monthly');

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase.from('transactions')
      .select('member_name, phone_number, amount, transaction_date, transaction_id')
      .gte('transaction_date', `${year}-01-01`)
      .lte('transaction_date', `${year}-12-31`)
      .order('transaction_date', { ascending: true });

    const txs = data || [];

    // Monthly aggregation
    const monthMap: Record<string, { total: number; count: number }> = {};
    for (let m = 1; m <= 12; m++) {
      const key = new Date(Number(year), m - 1).toLocaleString('default', { month: 'short' });
      monthMap[key] = { total: 0, count: 0 };
    }
    txs.forEach((tx) => {
      const key = new Date(tx.transaction_date).toLocaleString('default', { month: 'short' });
      if (monthMap[key]) {
        monthMap[key].total += Number(tx.amount);
        monthMap[key].count += 1;
      }
    });
    setMonthlyData(Object.entries(monthMap).map(([month, v]) => ({ month, ...v })));

    // Member aggregation
    const memberMap: Record<string, MemberReport> = {};
    txs.forEach((tx) => {
      const key = tx.phone_number;
      if (!memberMap[key]) memberMap[key] = { member_name: tx.member_name, phone_number: tx.phone_number, total: 0, count: 0, transactions: [] };
      memberMap[key].total += Number(tx.amount);
      memberMap[key].count += 1;
      memberMap[key].transactions.push({ transaction_date: tx.transaction_date, amount: Number(tx.amount), transaction_id: tx.transaction_id });
    });
    setMemberData(Object.values(memberMap).sort((a, b) => b.total - a.total));
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [year]);

  const exportMonthlyCSV = () => {
    const rows = [['Month', 'Total (KES)', 'Transactions'],
      ...monthlyData.map((r) => [r.month, r.total.toFixed(2), r.count])];
    download(rows, `monthly_report_${year}.csv`);
  };

  const exportMembersCSV = () => {
    const rows = [['Member Name', 'Phone', 'Total (KES)', 'Transactions'],
      ...memberData.map((r) => [r.member_name, r.phone_number, r.total.toFixed(2), r.count])];
    download(rows, `member_contributions_${year}.csv`);
  };

  const download = (rows: (string | number)[][], filename: string) => {
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${filename} downloaded` });
  };

  const grandTotal = monthlyData.reduce((s, m) => s + m.total, 0);

  const tabs = [{ id: 'monthly', label: 'Monthly Summary' }, { id: 'members', label: 'Member Contributions' }] as const;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Year: {year} · Grand total: <span className="font-semibold text-secondary">KES {grandTotal.toLocaleString()}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Input type="number" className="w-24" value={year} onChange={(e) => setYear(e.target.value)} min="2020" max="2030" />
          </div>
          <div className="pt-5">
            <Button variant="outline" onClick={activeTab === 'monthly' ? exportMonthlyCSV : exportMembersCSV} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : activeTab === 'monthly' ? (
        <div className="space-y-5">
          {/* Chart */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-display font-semibold text-foreground mb-4">Monthly Contributions – {year}</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                  formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Total']}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Month</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transactions</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyData.map((row) => (
                  <tr key={row.month} className="hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium text-foreground">{row.month} {year}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.count}</td>
                    <td className="px-5 py-3 text-secondary font-semibold">{row.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {memberData.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border py-16 text-center">
              <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No member contributions for {year}.</p>
            </div>
          ) : memberData.map((m) => (
            <details key={m.phone_number} className="bg-card rounded-xl border border-border overflow-hidden group">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">{m.member_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{m.member_name}</p>
                    <p className="text-xs text-muted-foreground">{m.phone_number} · {m.count} transaction{m.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-secondary font-bold">KES {m.total.toLocaleString()}</span>
                  <TrendingUp className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                </div>
              </summary>
              <div className="border-t border-border divide-y divide-border">
                {m.transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-muted-foreground text-sm">{tx.transaction_date} · <span className="font-mono text-xs">{tx.transaction_id}</span></span>
                    <span className="text-foreground font-medium text-sm">KES {tx.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
