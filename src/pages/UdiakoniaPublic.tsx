import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Cross, CreditCard, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UdiakoniaTx {
  id: string;
  member_name: string;
  amount: number;
  transaction_date: string;
  transaction_id: string;
}

export default function UdiakoniaPublicPage() {
  const [transactions, setTransactions] = useState<UdiakoniaTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select('id, member_name, amount, transaction_date, transaction_id')
        .eq('category', 'udiakonia')
        .gte('transaction_date', `${year}-01-01`)
        .lte('transaction_date', `${year}-12-31`)
        .order('transaction_date', { ascending: false });
      setTransactions(data || []);
      setLoading(false);
    };
    fetch();
  }, [year]);

  const total = transactions.reduce((s, tx) => s + Number(tx.amount), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Cross className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-foreground">Spiritual Friends</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              Home <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-secondary" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">Udiakonia Contributions</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {transactions.length} records · Total: <span className="font-semibold text-secondary">TSh {total.toLocaleString()}</span>
            </p>
          </div>
          <div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No Udiakonia contributions found for {year}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Member</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount (TSh)</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3.5 font-medium text-foreground">{tx.member_name}</td>
                      <td className="px-5 py-3.5 text-secondary font-semibold">{Number(tx.amount).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-muted-foreground text-sm">{tx.transaction_date}</td>
                      <td className="px-5 py-3.5 text-muted-foreground text-sm font-mono">{tx.transaction_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Spiritual Friends · Tanzania
      </footer>
    </div>
  );
}
