import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  Cross, BookOpen, Users, CreditCard, Heart, Play, Headphones,
  Mic2, ChevronRight, Star, Bell, CheckCircle2, Loader2, Mail,
  Phone, ArrowRight, Globe, Flame, Book, Music, Youtube } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Prayer {
  title: string;
  content: string;
  prayer_date: string;
}

// ─── Explorer Feed Data ──────────────────────────────────────────────────────
const FEED_ITEMS = [
{
  category: 'Bible Lesson',
  icon: Book,
  color: 'bg-blue-500',
  title: 'The Power of Faith in Hard Times',
  desc: 'A deep study of Hebrews 11 — the faith chapter — exploring how believers throughout history trusted God in impossible situations.',
  duration: '12 min read',
  tag: 'Hebrews 11',
  link: 'https://www.biblegateway.com/passage/?search=Hebrews+11&version=NIV'
},
{
  category: 'Podcast',
  icon: Headphones,
  color: 'bg-purple-500',
  title: 'The Bible Project — How to Read the Bible',
  desc: 'Tim Mackie and Jon Collins unpack the literary structure of Scripture to help you read the Bible as a unified story pointing to Jesus.',
  duration: '45 min listen',
  tag: 'BibleProject',
  link: 'https://bibleproject.com/podcast/how-to-read-the-bible/'
},
{
  category: 'Devotional Story',
  icon: Heart,
  color: 'bg-rose-500',
  title: 'How God Turned My Failure into a New Beginning',
  desc: 'A testimony about how surrendering our broken plans to God opens doors we never imagined — inspired by the life of Joseph in Genesis.',
  duration: '5 min read',
  tag: 'Genesis 50:20',
  link: 'https://www.biblegateway.com/passage/?search=Genesis+50%3A20&version=NIV'
},
{
  category: 'Worship',
  icon: Music,
  color: 'bg-amber-500',
  title: 'Goodness of God — Bethel Music (Live)',
  desc: 'An anthem of gratitude celebrating God\'s faithfulness across every season of life. Perfect for your morning devotion.',
  duration: '4 min',
  tag: 'Worship Song',
  link: 'https://www.youtube.com/watch?v=edKTMEnMEgI'
},
{
  category: 'Youth Program',
  icon: Flame,
  color: 'bg-orange-500',
  title: 'Finding Your Identity in Christ — Elevation Youth',
  desc: 'A powerful message for Christian youth discovering their God-given calling, identity, and purpose in today\'s world.',
  duration: '30 min',
  tag: 'Youth Series',
  link: 'https://www.youtube.com/watch?v=UWKdgKINJKg'
},
{
  category: 'Video',
  icon: Youtube,
  color: 'bg-red-500',
  title: 'The Problem of Evil — BibleProject Explore',
  desc: 'One of Christianity\'s hardest questions explored — why does God allow suffering, and how does the Bible address it?',
  duration: '18 min watch',
  tag: 'Apologetics',
  link: 'https://www.youtube.com/watch?v=AEIn3T6nDAo'
}];


const CATEGORIES = ['All', 'Bible Lesson', 'Podcast', 'Devotional Story', 'Worship', 'Youth Program', 'Video'];

// ─── Fade-in animation wrapper ───────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: {children: React.ReactNode;delay?: number;className?: string;}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {if (e.isIntersecting) setVisible(true);}, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)'
    }} className="bg-[sidebar-primary-foreground] bg-transparent">{children}</div>);

}

// ─── Floating cross particles ─────────────────────────────────────────────────
function HeroParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) =>
      <div
        key={i}
        className="absolute text-white/10 font-bold select-none"
        style={{
          left: `${i * 8.3 % 100}%`,
          top: `${i * 13.7 % 100}%`,
          fontSize: `${12 + i % 4 * 8}px`,
          animation: `float-${i % 3} ${4 + i % 3}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`
        }}>
        ✝</div>
      )}
    </div>);

}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function HomePage() {
  const { toast } = useToast();
  const [todayPrayer, setTodayPrayer] = useState<Prayer | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '' });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase.from('prayers').select('title, content, prayer_date').
    eq('prayer_date', today).eq('is_active', true).maybeSingle().
    then(({ data }) => setTodayPrayer(data));
  }, []);

  const filteredFeed = activeCategory === 'All' ?
  FEED_ITEMS :
  FEED_ITEMS.filter((i) => i.category === activeCategory);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email) return;
    setSignupLoading(true);
    const { error } = await supabase.from('member_subscribers').insert({
      full_name: form.full_name,
      email: form.email,
      phone_number: form.phone_number || null,
      subscribed_daily_prayer: true,
      subscribed_announcements: true
    });
    setSignupLoading(false);
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already registered!', description: 'This email is already subscribed.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      setSignupDone(true);
      toast({ title: '🎉 Welcome to Spiritual Friends!', description: 'You\'ll receive daily prayers & updates in your inbox.' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, hsl(221 83% 18%), hsl(221 83% 35%) 40%, hsl(158 64% 30%) 75%, hsl(158 64% 20%))',
        minHeight: 520
      }}>
        <HeroParticles />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, hsl(158 64% 55%), transparent 70%)' }} />

        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
          {/* Logo badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Cross className="w-10 h-10 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-semibold tracking-widest uppercase"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Star className="w-3 h-3 fill-current" /> Est. 2022 · Tanzania
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white mb-5 leading-tight tracking-tight">
            Spiritual<br />
            <span style={{ WebkitTextStroke: '2px rgba(255,255,255,0.4)', color: 'transparent' }}>Friends</span>
          </h1>

          <p className="text-white/75 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            A Christian youth fellowship rooted in faith, united by love, growing together in purpose.
          </p>

          {/* Stat chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {[
            { value: '20+', label: 'Members' },
            { value: '3+', label: 'Years Together' },
            { value: 'Daily', label: 'Prayers' }].
            map(({ value, label }) =>
            <div key={label} className="px-5 py-2.5 rounded-2xl text-white text-center"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-white/60 uppercase tracking-wide">{label}</div>
              </div>
            )}
          </div>

          {/* Hero CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#join">
              <Button size="lg" className="h-12 px-8 font-semibold gap-2 text-base rounded-2xl shadow-xl"
              style={{ background: 'hsl(158 64% 42%)', color: 'white' }}>
                <Bell className="w-5 h-5" /> Join & Get Daily Prayers
              </Button>
            </a>
            <Link to="/about">
              <Button size="lg" variant="outline" className="h-12 px-8 font-semibold gap-2 text-base rounded-2xl border-white/30 text-white bg-white/10 hover:bg-white/20">
                Learn More <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 md:h-16" style={{ fill: 'hsl(var(--background))' }}>
            <path d="M0,40 C360,0 1080,80 1440,40 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 md:px-6 w-full">

        {/* ── TODAY'S PRAYER ─────────────────────────────────────────────── */}
        {todayPrayer &&
        <FadeIn className="py-8">
            <div className="relative rounded-3xl overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(158 64% 45%))' }}>
              <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="relative p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 font-semibold text-sm uppercase tracking-wider">Today's Prayer</span>
                  <span className="ml-auto text-white/60 text-xs">{todayPrayer.prayer_date}</span>
                </div>
                <h3 className="text-white font-display font-bold text-xl mb-3">{todayPrayer.title}</h3>
                <p className="text-white/85 leading-relaxed">{todayPrayer.content}</p>
              </div>
            </div>
          </FadeIn>
        }

        {/* ── EXPLORER / FEED ────────────────────────────────────────────── */}
        <FadeIn delay={100} className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Explorer</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Bible lessons, podcasts, devotions & more</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-6 scrollbar-none">
            {CATEGORIES.map((cat) =>
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200',
                activeCategory === cat ?
                'bg-primary text-primary-foreground shadow-md' :
                'bg-muted text-muted-foreground hover:bg-muted/80'
              )}>
              {cat}</button>
            )}
          </div>

          {/* Feed grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeed.map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.title} delay={i * 60}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card rounded-2xl border border-border p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    
                    <div className="flex items-start gap-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', item.color)}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.category}</span>
                        <h3 className="font-display font-bold text-foreground text-sm leading-snug mt-0.5 group-hover:text-primary transition-colors line-clamp-2">{item.title}</h3>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">{item.desc}</p>
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">{item.tag}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                        <Play className="w-3 h-3 fill-current" />
                        {item.duration}
                      </div>
                    </div>
                  </a>
                </FadeIn>);

            })}
          </div>
        </FadeIn>

        {/* ── WHAT WE MANAGE ─────────────────────────────────────────────── */}
        <FadeIn delay={150} className="py-8">
          <h2 className="text-xl font-display font-bold text-foreground text-center mb-8">What We Manage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
            { icon: Users, title: 'Member Registry', desc: 'An updated directory of all group members with contact information.', color: 'bg-primary' },
            { icon: CreditCard, title: 'M-KOBA Contributions', desc: 'Track every M-Pesa contribution automatically via SMS or manual entry.', color: 'bg-secondary' },
            { icon: BookOpen, title: 'Daily Prayers', desc: 'Liturgical prayers delivered to members every day via email.', color: 'bg-accent' },
            { icon: CreditCard, title: 'Financial Reports', desc: 'Monthly and per-member contribution reports, exportable to CSV.', color: 'bg-primary' }].
            map(({ icon: Icon, title, desc, color }) =>
            <div key={title} className="bg-card rounded-2xl border border-border p-5 flex gap-4 hover:shadow-md transition-shadow">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            )}
          </div>
        </FadeIn>

        {/* ── JOIN / SIGNUP ──────────────────────────────────────────────── */}
        <div id="join">
        <FadeIn delay={200} className="py-8">
          <div className="rounded-3xl overflow-hidden border border-border shadow-xl">
            {/* Header */}
            <div className="px-6 pt-8 pb-6 text-center"
              style={{ background: 'linear-gradient(135deg, hsl(221 83% 53% / 0.08), hsl(158 64% 45% / 0.08))' }}>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Join Spiritual Friends
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Register to receive <strong>daily prayers</strong>, group announcements, and spiritual content straight to your inbox. Free forever.
              </p>
            </div>

            <div className="bg-card px-6 py-6">
              {signupDone ?
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-9 h-9 text-secondary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground text-lg mb-2">You're in! 🎉</h3>
                  <p className="text-muted-foreground text-sm">Welcome to Spiritual Friends. Check your inbox for a welcome message and today's prayer.</p>
                </div> :

                <form onSubmit={handleSignup} className="space-y-4 max-w-md mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Your full name"
                        value={form.full_name}
                        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                        required
                        className="pl-9 rounded-xl" />
                      
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Phone (optional)"
                        value={form.phone_number}
                        onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                        className="pl-9 rounded-xl" />
                      
                    </div>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                      className="pl-9 rounded-xl" />
                    
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-primary" readOnly /> 📿 Daily prayer emails
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-primary" readOnly /> 📢 Group announcements
                    </label>
                  </div>

                  <Button type="submit" disabled={signupLoading} className="w-full h-11 rounded-xl font-semibold gap-2">
                    {signupLoading ?
                    <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> :
                    <><Bell className="w-4 h-4" /> Join & Subscribe</>
                    }
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Already a registered Member?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">​Log In here!    </Link>
                  </p>
                </form>
                }
            </div>
          </div>
        </FadeIn>
        </div>

        {/* ── SCRIPTURE ──────────────────────────────────────────────────── */}
        <FadeIn delay={100} className="py-10 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-4xl mb-4 opacity-30">✝</div>
            <blockquote className="text-xl md:text-2xl text-foreground/80 italic font-display leading-relaxed">
              "For where two or three gather in my name,<br className="hidden md:block" /> there am I with them."
            </blockquote>
            <cite className="text-muted-foreground text-sm mt-4 block">— Matthew 18:20</cite>
          </div>
        </FadeIn>

      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Cross className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-sm">Spiritual Friends</p>
                <p className="text-muted-foreground text-xs">Tanzania Christian Youth Fellowship</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
              <Link to="/udiakonia" className="hover:text-primary transition-colors">Udiakonia</Link>
              <Link to="/about" className="hover:text-primary transition-colors">Contact</Link>
              <Link
                to="/admin"
                className="opacity-10 hover:opacity-30 transition-opacity duration-300 text-muted-foreground text-xs select-none"
                tabIndex={-1}
                aria-hidden="true">
                
                ·
              </Link>
              <span>© {new Date().getFullYear()} · Built with love ✝️</span>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for hero particle animations */}
      <style>{`
        @keyframes float-0 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes float-1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-18px) rotate(10deg); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px) rotate(-5deg); } }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>);

}