import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Cross, BookOpen, Users, CreditCard, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Prayer {
  title: string;
  content: string;
  prayer_date: string;
}

export default function HomePage() {
  const [todayPrayer, setTodayPrayer] = useState<Prayer | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase.from('prayers').select('title, content, prayer_date')
      .eq('prayer_date', today).eq('is_active', true).maybeSingle()
      .then(({ data }) => setTodayPrayer(data));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(158 64% 45%))' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Cross className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Spiritual Friends</h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            A Christian youth group united in faith, fellowship, and prayer.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 shadow-lg">
              <LogIn className="w-5 h-5" /> Admin Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full space-y-12">
        {/* Today's Prayer */}
        {todayPrayer && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-display font-bold text-foreground">Today's Prayer</h2>
              <span className="text-muted-foreground text-sm">{todayPrayer.prayer_date}</span>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-display font-semibold text-foreground text-lg mb-3">{todayPrayer.title}</h3>
              <p className="text-foreground/80 leading-relaxed">{todayPrayer.content}</p>
            </div>
          </section>
        )}

        {/* Features */}
        <section>
          <h2 className="text-xl font-display font-bold text-foreground text-center mb-8">What We Manage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: Users, title: 'Member Registry', desc: 'Keep an updated directory of all group members with their contact information.', color: 'bg-primary' },
              { icon: CreditCard, title: 'M-Pesa Contributions', desc: 'Track every contribution automatically from M-Pesa SMS imports or manual entries.', color: 'bg-secondary' },
              { icon: BookOpen, title: 'Daily Prayers', desc: 'Share daily prayer messages that appear on the home page for all members.', color: 'bg-accent' },
              { icon: Cross, title: 'Financial Reports', desc: 'Generate monthly and per-member contribution reports, exportable to CSV.', color: 'bg-primary' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-card rounded-2xl border border-border p-6 flex gap-4">
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Scripture */}
        <section className="text-center py-8">
          <blockquote className="text-lg text-foreground/70 italic font-display max-w-xl mx-auto">
            "For where two or three gather in my name, there am I with them."
          </blockquote>
          <cite className="text-muted-foreground text-sm mt-3 block">— Matthew 18:20</cite>
        </section>
      </main>

      <footer className="border-t border-border py-5 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Spiritual Friends · Built with love ✝️
      </footer>
    </div>
  );
}
