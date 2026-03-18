import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Cross, Heart, Target, Eye, TrendingUp, Users, Star, BookOpen,
  Globe, Sun, Moon, LogIn, ChevronDown, Handshake, Sprout, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────
const t = {
  en: {
    navAbout: 'About Us',
    navLogin: 'Admin Login',
    heroTitle: 'Spiritual Friends',
    heroSubtitle: 'A Christian youth group rooted in faith, united by love, and growing together in service.',
    heroBibleVerse: '"Each of you should help your neighbors and say to them, \'Be strong!\'" — Isaiah 41:6',
    introHeading: 'Who We Are',
    introParagraph:
      'Spiritual Friends is a vibrant Christian youth group brought together by a shared desire to grow — spiritually, socially, and in service to others. We believe that faith is not a solitary journey, but one best walked side by side with brothers and sisters who encourage, challenge, and uplift one another.',
    historyHeading: 'Our Story',
    historyParagraph:
      'In April 2022, six young people dared to believe that a small fellowship could make a big difference. What began as phone calls and warm conversations among a tight-knit circle of friends slowly grew into something far greater — a community of faith.',
    historyFounders: 'Founding Members',
    founders: [
      'Albert Mamuya',
      'Cathbert Mamuya',
      'Godlisten Makundi',
      'Verynice Kimei',
      'Nuruel Temu',
      'Imman Mosha',
    ],
    timelineHeading: 'Our Journey',
    timeline: [
      { year: '2022', label: 'Founded', desc: '6 friends start a simple fellowship through calls & prayer.' },
      { year: '2023', label: 'Organised', desc: 'Group formalises, adopts Udiakonia as its central goal.' },
      { year: '2024', label: 'Mfuko wa Mkoba', desc: 'A contribution system is launched to support members.' },
      { year: '2025', label: 'Growing', desc: 'Membership surpasses 20; community projects begin.' },
      { year: 'Now', label: 'Thriving', desc: 'Steadily growing, impacting youth and serving society.' },
    ],
    purposeHeading: 'Purpose & Transformation',
    purposeText:
      'The group adopted "Udiakonia" — the spirit of service and helping others — as its mother goal. This calling shapes every decision, from how members support one another financially through "Mfuko wa Mkoba" to how they engage their wider community with compassion and action.',
    missionHeading: 'Our Mission',
    missionPoints: [
      'Build deep unity among all members',
      'Support each other spiritually and financially',
      'Serve others through Udiakonia',
    ],
    visionHeading: 'Our Vision',
    visionPoints: [
      'Become a strong, impactful Christian youth community',
      'Inspire faith, love, and service across society',
    ],
    ambitionHeading: 'Future Goals',
    ambitions: [
      'Expand the group to reach more youth',
      'Strengthen financial systems like Mfuko wa Mkoba',
      'Launch impactful community service projects',
      'Use technology to improve communication & management',
    ],
    counterHeading: 'Our Growth',
    counterMembers: 'Active Members',
    counterYears: 'Years Together',
    counterGoals: 'Core Goals',
    bibleVerseHeading: 'A Word of Encouragement',
    bibleVerse:
      '"Each of you should help your neighbors and say to them, \'Be strong!\' — and he will support the craftsman who strikes the anvil." — Isaiah 41:6-7',
    gratitudeHeading: 'Grateful Hearts',
    gratitudeText:
      'We are deeply grateful to God for His faithfulness — from six to twenty-plus members, every step has been guided by His hand. We celebrate the unity, love, and perseverance that have carried Spiritual Friends this far. The best is still ahead.',
    footerText: '© {year} Spiritual Friends · Built with love ✝️',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeChurch: 'Church',
    langEn: 'English',
    langSw: 'Swahili',
  },
  sw: {
    navAbout: 'Kuhusu Sisi',
    navLogin: 'Ingia',
    heroTitle: 'Marafiki wa Kiroho',
    heroSubtitle: 'Kikundi cha vijana wa Kikristo kilichojengwa katika imani, kimoja kwa upendo, kinachokua pamoja katika huduma.',
    heroBibleVerse: '"Kila mmoja wenu asaidie jirani yake, na kumwambia, Uwe imara!" — Isaya 41:6',
    introHeading: 'Sisi ni Nani',
    introParagraph:
      'Marafiki wa Kiroho ni kikundi hai cha vijana wa Kikristo waliokusanyika pamoja kwa hamu ya kukua — kiroho, kijamii, na katika huduma kwa wengine. Tunaamini kwamba imani si safari ya peke yako, bali safari inayopendeza zaidi unapotembea bega kwa bega na ndugu na dada wanaokutia moyo, kukuchochea, na kukuinua.',
    historyHeading: 'Historia Yetu',
    historyParagraph:
      'Mnamo Aprili 2022, vijana sita waliamua kuamini kwamba ushirika mdogo ungeweza kuleta mabadiliko makubwa. Kilichoanza kama simu za kawaida na mazungumzo ya ukarimu miongoni mwa kikundi kidogo cha marafiki polepole kilikua kuwa kitu kikubwa zaidi — jamii ya imani.',
    historyFounders: 'Waanzilishi',
    founders: [
      'Albert Mamuya',
      'Cathbert Mamuya',
      'Godlisten Makundi',
      'Verynice Kimei',
      'Nuruel Temu',
      'Imman Mosha',
    ],
    timelineHeading: 'Safari Yetu',
    timeline: [
      { year: '2022', label: 'Kuanzishwa', desc: 'Marafiki 6 wanaanza ushirika mdogo kupitia simu na sala.' },
      { year: '2023', label: 'Kupangwa', desc: 'Kikundi kinarasimishwa na kupitisha Udiakonia kama lengo kuu.' },
      { year: '2024', label: 'Mfuko wa Mkoba', desc: 'Mfumo wa mchango unazinduliwa kusaidia wanachama.' },
      { year: '2025', label: 'Kukua', desc: 'Uanachama unazidi 20; miradi ya jamii inaanza.' },
      { year: 'Leo', label: 'Kusitawi', desc: 'Kukua kwa kasi, kuathiri vijana na kutumikia jamii.' },
    ],
    purposeHeading: 'Lengo na Mabadiliko',
    purposeText:
      'Kikundi kilipitisha "Udiakonia" — roho ya huduma na kusaidia wengine — kama lengo kuu. Wito huu huunda kila uamuzi, kuanzia jinsi wanachama wanavyosaidiana kifedha kupitia "Mfuko wa Mkoba" hadi jinsi wanavyohusiana na jamii yao kwa huruma na vitendo.',
    missionHeading: 'Dhamira Yetu',
    missionPoints: [
      'Kujenga umoja wa kweli miongoni mwa wanachama wote',
      'Kusaidiana kiroho na kifedha',
      'Kutumikia wengine kupitia Udiakonia',
    ],
    visionHeading: 'Maono Yetu',
    visionPoints: [
      'Kuwa jamii yenye nguvu na yenye athari ya vijana wa Kikristo',
      'Kuhamasisha imani, upendo, na huduma katika jamii',
    ],
    ambitionHeading: 'Malengo ya Baadaye',
    ambitions: [
      'Kupanua kikundi kufikia vijana zaidi',
      'Kuimarisha mifumo ya fedha kama Mfuko wa Mkoba',
      'Kuanzisha miradi ya huduma ya jamii yenye athari',
      'Kutumia teknolojia kuboresha mawasiliano na usimamizi',
    ],
    counterHeading: 'Ukuaji Wetu',
    counterMembers: 'Wanachama',
    counterYears: 'Miaka Pamoja',
    counterGoals: 'Malengo Makuu',
    bibleVerseHeading: 'Neno la Faraja',
    bibleVerse:
      '"Kila mmoja wenu asaidie jirani yake, na kumwambia, Uwe imara! — naye atasaidia mfundi aliyeumba nyundo." — Isaya 41:6-7',
    gratitudeHeading: 'Mioyo ya Shukrani',
    gratitudeText:
      'Tunashukuru sana kwa uaminifu wa Mungu — kutoka wanachama sita hadi zaidi ya ishirini, kila hatua imeongozwa na Mkono Wake. Tunaadhimisha umoja, upendo, na uvumilivu ambao umebeba Marafiki wa Kiroho hadi hapa. Kilicho bora bado kiko mbele.',
    footerText: '© {year} Marafiki wa Kiroho · Imejengwa kwa upendo ✝️',
    themeLight: 'Mwanga',
    themeDark: 'Giza',
    themeChurch: 'Kanisa',
    langEn: 'Kiingereza',
    langSw: 'Kiswahili',
  },
} as const;

type Lang = 'en' | 'sw';
type Theme = 'light' | 'dark' | 'church';

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────
function AnimatedCounter({ target, label }: { target: number; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = Math.ceil(target / 60);
          const interval = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(interval); }
            else setCount(start);
          }, 25);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl font-display font-extrabold" style={{ color: 'var(--about-accent)' }}>
        {count}{target > 10 ? '+' : ''}
      </div>
      <div className="mt-1 text-sm font-medium opacity-70">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FADE-IN WRAPPER
// ─────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// THEME STYLES
// ─────────────────────────────────────────────
const themeVars: Record<Theme, React.CSSProperties> = {
  light: {
    '--about-bg': 'hsl(210 40% 98%)',
    '--about-surface': 'hsl(0 0% 100%)',
    '--about-border': 'hsl(210 25% 88%)',
    '--about-text': 'hsl(220 25% 15%)',
    '--about-muted': 'hsl(220 15% 50%)',
    '--about-hero-from': 'hsl(221 83% 53%)',
    '--about-hero-to': 'hsl(158 64% 45%)',
    '--about-accent': 'hsl(221 83% 53%)',
    '--about-card-shadow': '0 4px 24px rgba(0,0,0,0.07)',
  } as React.CSSProperties,
  dark: {
    '--about-bg': 'hsl(222 47% 8%)',
    '--about-surface': 'hsl(222 40% 12%)',
    '--about-border': 'hsl(222 30% 22%)',
    '--about-text': 'hsl(210 40% 95%)',
    '--about-muted': 'hsl(220 20% 60%)',
    '--about-hero-from': 'hsl(221 83% 40%)',
    '--about-hero-to': 'hsl(158 64% 32%)',
    '--about-accent': 'hsl(221 83% 65%)',
    '--about-card-shadow': '0 4px 24px rgba(0,0,0,0.4)',
  } as React.CSSProperties,
  church: {
    '--about-bg': 'hsl(220 30% 97%)',
    '--about-surface': 'hsl(0 0% 100%)',
    '--about-border': 'hsl(43 74% 80%)',
    '--about-text': 'hsl(220 50% 15%)',
    '--about-muted': 'hsl(220 20% 50%)',
    '--about-hero-from': 'hsl(220 60% 30%)',
    '--about-hero-to': 'hsl(38 90% 50%)',
    '--about-accent': 'hsl(38 90% 45%)',
    '--about-card-shadow': '0 4px 24px rgba(38,90,45,0.1)',
  } as React.CSSProperties,
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function AboutPage() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('sf-lang') as Lang) || 'en');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('sf-theme') as Theme) || 'light');
  const [langOpen, setLangOpen] = useState(false);

  const txt = t[lang];

  useEffect(() => { localStorage.setItem('sf-lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('sf-theme', theme); }, [theme]);

  const themeIcons: Record<Theme, React.ReactNode> = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    church: <Cross className="w-4 h-4" />,
  };
  const themeLabels: Record<Theme, string> = {
    light: txt.themeLight,
    dark: txt.themeDark,
    church: txt.themeChurch,
  };
  const themeOrder: Theme[] = ['light', 'dark', 'church'];

  return (
    <div
      style={{ ...themeVars[theme], backgroundColor: 'var(--about-bg)', color: 'var(--about-text)', transition: 'all 0.4s ease' } as React.CSSProperties}
      className="min-h-screen font-sans"
    >
      {/* ── NAV ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 shadow-sm"
        style={{ backgroundColor: 'var(--about-surface)', borderBottom: '1px solid var(--about-border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--about-accent)' }}>
            <Cross className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-sm hidden sm:block">{txt.navAbout}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <div className="flex items-center gap-1 rounded-full p-1 border" style={{ borderColor: 'var(--about-border)', backgroundColor: 'var(--about-bg)' }}>
            {themeOrder.map((th) => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                title={themeLabels[th]}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200',
                  theme === th ? 'text-white shadow-sm' : 'opacity-50 hover:opacity-80'
                )}
                style={theme === th ? { background: 'var(--about-accent)' } : {}}
              >
                {themeIcons[th]}
              </button>
            ))}
          </div>

          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:opacity-80"
              style={{ borderColor: 'var(--about-border)', backgroundColor: 'var(--about-bg)' }}
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'EN' : 'SW'}
              <ChevronDown className={cn('w-3 h-3 transition-transform', langOpen && 'rotate-180')} />
            </button>
            {langOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-xl shadow-lg border overflow-hidden z-50 w-36"
                style={{ backgroundColor: 'var(--about-surface)', borderColor: 'var(--about-border)' }}
              >
                {(['en', 'sw'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm hover:opacity-80 transition-colors',
                      lang === l && 'font-semibold'
                    )}
                    style={lang === l ? { color: 'var(--about-accent)' } : {}}
                  >
                    {l === 'en' ? txt.langEn : txt.langSw}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/login"
            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 shadow-sm"
            style={{ background: 'var(--about-accent)' }}
          >
            <LogIn className="w-3.5 h-3.5" />
            {txt.navLogin}
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header
        className="relative overflow-hidden py-20 px-5 text-center"
        style={{ background: `linear-gradient(135deg, var(--about-hero-from), var(--about-hero-to))` }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <FadeIn className="relative max-w-3xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Cross className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-4 drop-shadow">{txt.heroTitle}</h1>
          <p className="text-white/85 text-lg md:text-xl mb-6 max-w-xl mx-auto leading-relaxed">{txt.heroSubtitle}</p>
          <p className="text-white/65 text-sm italic max-w-lg mx-auto">{txt.heroBibleVerse}</p>
        </FadeIn>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-16 space-y-20">

        {/* ── INTRO ── */}
        <FadeIn>
          <section className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-5 h-5" style={{ color: 'var(--about-accent)' }} />
              <h2 className="text-2xl font-display font-bold">{txt.introHeading}</h2>
            </div>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--about-muted)' }}>{txt.introParagraph}</p>
          </section>
        </FadeIn>

        {/* ── COUNTERS ── */}
        <FadeIn>
          <section
            className="rounded-3xl py-12 px-8"
            style={{ background: `linear-gradient(135deg, var(--about-hero-from), var(--about-hero-to))` }}
          >
            <h2 className="text-xl font-display font-bold text-white text-center mb-10">{txt.counterHeading}</h2>
            <div className="grid grid-cols-3 gap-6 text-white">
              <AnimatedCounter target={20} label={txt.counterMembers} />
              <AnimatedCounter target={3} label={txt.counterYears} />
              <AnimatedCounter target={4} label={txt.counterGoals} />
            </div>
          </section>
        </FadeIn>

        {/* ── HISTORY ── */}
        <section>
          <FadeIn>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5" style={{ color: 'var(--about-accent)' }} />
              <h2 className="text-2xl font-display font-bold">{txt.historyHeading}</h2>
            </div>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--about-muted)' }}>{txt.historyParagraph}</p>
          </FadeIn>

          {/* Founders grid */}
          <FadeIn delay={100}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--about-accent)' }}>{txt.historyFounders}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {txt.founders.map((name, i) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-2xl p-3 border"
                  style={{ backgroundColor: 'var(--about-surface)', borderColor: 'var(--about-border)', boxShadow: 'var(--about-card-shadow)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'var(--about-accent)' }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium leading-tight">{name}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* ── TIMELINE ── */}
        <section>
          <FadeIn>
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--about-accent)' }} />
              <h2 className="text-2xl font-display font-bold">{txt.timelineHeading}</h2>
            </div>
          </FadeIn>
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-0.5 hidden sm:block"
              style={{ background: 'var(--about-accent)', opacity: 0.25 }}
            />
            <div className="space-y-6">
              {txt.timeline.map((item, i) => (
                <FadeIn key={item.year} delay={i * 80}>
                  <div className="flex gap-5 items-start sm:pl-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-bold text-xs shadow-md z-10 relative"
                        style={{ background: 'var(--about-accent)' }}
                      >
                        {item.year}
                      </div>
                    </div>
                    <div
                      className="flex-1 rounded-2xl p-4 border"
                      style={{ backgroundColor: 'var(--about-surface)', borderColor: 'var(--about-border)', boxShadow: 'var(--about-card-shadow)' }}
                    >
                      <p className="font-display font-bold text-base mb-1">{item.label}</p>
                      <p className="text-sm" style={{ color: 'var(--about-muted)' }}>{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── PURPOSE ── */}
        <FadeIn>
          <section
            className="rounded-3xl p-8 border"
            style={{ backgroundColor: 'var(--about-surface)', borderColor: 'var(--about-border)', boxShadow: 'var(--about-card-shadow)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Handshake className="w-5 h-5" style={{ color: 'var(--about-accent)' }} />
              <h2 className="text-2xl font-display font-bold">{txt.purposeHeading}</h2>
            </div>
            <p className="text-base leading-relaxed" style={{ color: 'var(--about-muted)' }}>{txt.purposeText}</p>
          </section>
        </FadeIn>

        {/* ── MISSION & VISION ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FadeIn delay={0}>
            <div
              className="rounded-3xl p-7 border h-full"
              style={{ backgroundColor: 'var(--about-surface)', borderColor: 'var(--about-border)', boxShadow: 'var(--about-card-shadow)' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white"
                style={{ background: 'var(--about-accent)' }}>
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-bold mb-4">{txt.missionHeading}</h3>
              <ul className="space-y-2.5">
                {txt.missionPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm" style={{ color: 'var(--about-muted)' }}>
                    <Star className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--about-accent)' }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <div
              className="rounded-3xl p-7 border h-full"
              style={{ backgroundColor: 'var(--about-surface)', borderColor: 'var(--about-border)', boxShadow: 'var(--about-card-shadow)' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white"
                style={{ background: 'var(--about-accent)' }}>
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-bold mb-4">{txt.visionHeading}</h3>
              <ul className="space-y-2.5">
                {txt.visionPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm" style={{ color: 'var(--about-muted)' }}>
                    <Star className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--about-accent)' }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </section>

        {/* ── AMBITIONS ── */}
        <section>
          <FadeIn>
            <div className="flex items-center gap-2 mb-6">
              <Sprout className="w-5 h-5" style={{ color: 'var(--about-accent)' }} />
              <h2 className="text-2xl font-display font-bold">{txt.ambitionHeading}</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {txt.ambitions.map((a, i) => (
              <FadeIn key={a} delay={i * 60}>
                <div
                  className="flex items-start gap-3 p-5 rounded-2xl border"
                  style={{ backgroundColor: 'var(--about-surface)', borderColor: 'var(--about-border)', boxShadow: 'var(--about-card-shadow)' }}
                >
                  <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--about-accent)' }} />
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--about-muted)' }}>{a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── BIBLE VERSE ── */}
        <FadeIn>
          <section
            className="text-center py-12 px-8 rounded-3xl border relative overflow-hidden"
            style={{ backgroundColor: 'var(--about-surface)', borderColor: 'var(--about-border)', boxShadow: 'var(--about-card-shadow)' }}
          >
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, var(--about-accent) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white"
                style={{ background: 'var(--about-accent)' }}>
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--about-accent)' }}>
                {txt.bibleVerseHeading}
              </p>
              <blockquote className="text-lg md:text-xl font-display italic max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--about-muted)' }}>
                {txt.bibleVerse}
              </blockquote>
            </div>
          </section>
        </FadeIn>

        {/* ── GRATITUDE ── */}
        <FadeIn>
          <section
            className="rounded-3xl p-8 text-center text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, var(--about-hero-from), var(--about-hero-to))` }}
          >
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="relative">
              <Users className="w-10 h-10 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-display font-bold mb-3">{txt.gratitudeHeading}</h2>
              <p className="text-white/80 text-base leading-relaxed max-w-xl mx-auto">{txt.gratitudeText}</p>
            </div>
          </section>
        </FadeIn>

      </main>

      {/* ── FOOTER ── */}
      <footer
        className="border-t py-6 text-center text-sm"
        style={{ borderColor: 'var(--about-border)', color: 'var(--about-muted)' }}
      >
        {txt.footerText.replace('{year}', String(new Date().getFullYear()))}
      </footer>
    </div>
  );
}
