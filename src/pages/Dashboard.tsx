import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Users, CreditCard, TrendingUp, BookOpen, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const labels = {
  en: {
    title: 'Dashboard', welcome: 'Welcome to Spiritual Friends Management',
    addMember: 'Add Member', todayPrayer: "Today's Prayer",
    totalMembers: 'Total Members', totalContributions: 'Total Contributions',
    thisMonth: 'This Month', monthlyChart: 'Monthly Contributions (TSh)',
    recentTx: 'Recent Transactions', viewAll: 'View all', noTx: 'No transactions yet.',
    contributions: 'Contributions',
  },
  sw: {
    title: 'Dashibodi', welcome: 'Karibu kwenye Usimamizi wa Marafiki wa Kiroho',
    addMember: 'Ongeza Mwanachama', todayPrayer: 'Sala ya Leo',
    totalMembers: 'Wanachama Wote', totalContributions: 'Michango Yote',
    thisMonth: 'Mwezi Huu', monthlyChart: 'Michango ya Kila Mwezi (TSh)',
    recentTx: 'Miamala ya Hivi Karibuni', viewAll: 'Tazama yote', noTx: 'Hakuna miamala bado.',
    contributions: 'Michango',
  },
} as const;
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface Stats {
  memberCount: number;
  totalContributions: number;
  thisMonthContributions: number;
  recentTransactions: Array<{
    id: string; member_name: string; amount: number; transaction_date: string; transaction_id: string;
  }>;
  todayPrayer: { title: string; content: string } | null;
  monthlyData: Array<{ month: string; total: number }>;
}

const StatCard = ({
  label, value, icon: Icon, color, sub,
}: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) => (
  <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-display font-bold text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { lang } = useAppTheme();
  const t = labels[lang];
  const [stats, setStats] = useState<Stats>({
    memberCount: 0, totalContributions: 0, thisMonthContributions: 0,
    recentTransactions: [], todayPrayer: null, monthlyData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];

      const [membersRes, allTxRes, monthTxRes, recentTxRes, prayerRes] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('amount'),
        supabase.from('transactions').select('amount').gte('transaction_date', startOfMonth),
        supabase.from('transactions').select('id, member_name, amount, transaction_date, transaction_id').order('transaction_date', { ascending: false }).limit(5),
        supabase.from('prayers').select('title, content').eq('prayer_date', today).eq('is_active', true).maybeSingle(),
      ]);

      // Build monthly chart data (last 6 months)
      const monthlyMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyMap[key] = 0;
      }
      (allTxRes.data || []).forEach((tx) => {
        const d = new Date(tx.amount); // placeholder, we'll fix below
      });

      // Fetch monthly breakdown
      const { data: monthlyTx } = await supabase.from('transactions')
        .select('amount, transaction_date')
        .gte('transaction_date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]);

      (monthlyTx || []).forEach((tx) => {
        const d = new Date(tx.transaction_date);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (monthlyMap[key] !== undefined) monthlyMap[key] += Number(tx.amount);
      });

      const monthlyData = Object.entries(monthlyMap).map(([month, total]) => ({ month, total }));

      setStats({
        memberCount: membersRes.count ?? 0,
        totalContributions: (allTxRes.data || []).reduce((s, t) => s + Number(t.amount), 0),
        thisMonthContributions: (monthTxRes.data || []).reduce((s, t) => s + Number(t.amount), 0),
        recentTransactions: recentTxRes.data || [],
        todayPrayer: prayerRes.data,
        monthlyData,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const fmt = (n: number) => `TSh ${n.toLocaleString('sw-TZ', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.welcome}</p>
        </div>
        <Link to="/members">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> {t.addMember}
          </button>
        </Link>
      </div>

      {/* Today's Prayer Banner */}
      {stats.todayPrayer && (
        <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(158 64% 45%))' }}>
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-white/80 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide font-medium mb-1">{t.todayPrayer}</p>
              <h3 className="text-white font-display font-semibold text-lg mb-2">{stats.todayPrayer.title}</h3>
              <p className="text-white/85 text-sm leading-relaxed line-clamp-3">{stats.todayPrayer.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label={t.totalMembers} value={stats.memberCount} icon={Users} color="bg-primary" />
        <StatCard label={t.totalContributions} value={fmt(stats.totalContributions)} icon={CreditCard} color="bg-secondary" />
        <StatCard
          label={t.thisMonth}
          value={fmt(stats.thisMonthContributions)}
          icon={TrendingUp}
          color="bg-accent"
          sub={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display font-semibold text-foreground mb-4">{t.monthlyChart}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
              formatter={(v: number) => [`TSh ${v.toLocaleString()}`, t.contributions]}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-semibold text-foreground">{t.recentTx}</h2>
          <Link to="/transactions" className="text-primary text-sm font-medium hover:underline">{t.viewAll}</Link>
        </div>
        {stats.recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{t.noTx}</div>
        ) : (
          <div className="divide-y divide-border">
            {stats.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-foreground text-sm">{tx.member_name}</p>
                  <p className="text-xs text-muted-foreground">{tx.transaction_id} · {tx.transaction_date}</p>
                </div>
                <span className="text-secondary font-semibold text-sm">+TSh {Number(tx.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
