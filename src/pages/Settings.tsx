import { Sun, Moon, Cross, Globe, Settings2, Palette, Bell, Shield, User, Info } from 'lucide-react';
import { useAppTheme, AppTheme, AppLang } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const labels = {
  en: {
    title: 'Settings',
    subtitle: 'Manage your app preferences, appearance and account options.',
    appearance: 'Appearance',
    appearanceSub: 'Choose how the app looks across all pages.',
    themes: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeChurch: 'Church',
    themeDesc: {
      light: 'Clean, bright look for day use.',
      dark: 'Easy on the eyes at night.',
      church: 'Deep blue & gold spiritual tone.',
    },
    language: 'Language',
    languageSub: 'Select the display language for the app.',
    langEn: 'English',
    langSw: 'Swahili',
    account: 'Account',
    accountSub: 'Your profile and access details.',
    email: 'Email',
    role: 'Role',
    about: 'About',
    aboutSub: 'App information.',
    version: 'Version',
    build: 'Build',
    privacy: 'Privacy',
    privacySub: 'Your data is stored securely and never shared.',
    notImplemented: 'More settings coming soon.',
  },
  sw: {
    title: 'Mipangilio',
    subtitle: 'Simamia mapendeleo ya programu, mwonekano na chaguo za akaunti.',
    appearance: 'Mwonekano',
    appearanceSub: 'Chagua jinsi programu inavyoonekana kwenye kurasa zote.',
    themes: 'Mandhari',
    themeLight: 'Mwanga',
    themeDark: 'Giza',
    themeChurch: 'Kanisa',
    themeDesc: {
      light: 'Muonekano mkali, mwangaza wakati wa mchana.',
      dark: 'Mpole kwa macho usiku.',
      church: 'Bluu nzito na dhahabu ya kiroho.',
    },
    language: 'Lugha',
    languageSub: 'Chagua lugha ya kuonyesha kwa programu.',
    langEn: 'Kiingereza',
    langSw: 'Kiswahili',
    account: 'Akaunti',
    accountSub: 'Maelezo ya wasifu wako na ufikiaji.',
    email: 'Barua pepe',
    role: 'Jukumu',
    about: 'Kuhusu',
    aboutSub: 'Maelezo ya programu.',
    version: 'Toleo',
    build: 'Ujenzi',
    privacy: 'Faragha',
    privacySub: 'Data yako inahifadhiwa salama na haishirikiwi.',
    notImplemented: 'Mipangilio zaidi inakuja hivi karibuni.',
  },
} as const;

type ThemeOption = { value: AppTheme; icon: React.ReactNode; label: string; desc: string };
type LangOption = { value: AppLang; flag: string; label: string };

export default function SettingsPage() {
  const { theme, setTheme, lang, setLang } = useAppTheme();
  const { user } = useAuth();

  const t = labels[lang];

  const themeOptions: ThemeOption[] = [
    { value: 'light', icon: <Sun className="w-5 h-5" />, label: t.themeLight, desc: t.themeDesc.light },
    { value: 'dark', icon: <Moon className="w-5 h-5" />, label: t.themeDark, desc: t.themeDesc.dark },
    { value: 'church', icon: <Cross className="w-5 h-5" />, label: t.themeChurch, desc: t.themeDesc.church },
  ];

  const langOptions: LangOption[] = [
    { value: 'en', flag: '🇬🇧', label: t.langEn },
    { value: 'sw', flag: '🇹🇿', label: t.langSw },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">{t.title}</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-13 pl-[52px]">{t.subtitle}</p>
      </div>

      {/* ── APPEARANCE ── */}
      <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/40">
          <Palette className="w-4 h-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">{t.appearance}</h2>
            <p className="text-xs text-muted-foreground">{t.appearanceSub}</p>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Theme */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{t.themes}</p>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(({ value, icon, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 hover:border-primary/50',
                    theme === value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                      : 'border-border bg-background hover:bg-muted/50'
                  )}
                >
                  {theme === value && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                  )}
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                    theme === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {icon}
                  </div>
                  <div>
                    <p className={cn('text-sm font-semibold', theme === value ? 'text-primary' : 'text-foreground')}>{label}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{t.language}</p>
            <p className="text-xs text-muted-foreground mb-3">{t.languageSub}</p>
            <div className="flex gap-3">
              {langOptions.map(({ value, flag, label }) => (
                <button
                  key={value}
                  onClick={() => setLang(value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                    lang === value
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-foreground hover:bg-muted/50'
                  )}
                >
                  <Globe className="w-4 h-4" />
                  <span>{flag}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ACCOUNT ── */}
      <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/40">
          <User className="w-4 h-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">{t.account}</h2>
            <p className="text-xs text-muted-foreground">{t.accountSub}</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">{t.email}</span>
            <span className="text-sm font-medium truncate max-w-[240px]">{user?.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t.role}</span>
            <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-primary/10 text-primary">Admin</span>
          </div>
        </div>
      </section>

      {/* ── PRIVACY ── */}
      <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/40">
          <Shield className="w-4 h-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">{t.privacy}</h2>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground">{t.privacySub}</p>
        </div>
      </section>

      {/* ── NOTIFICATIONS PLACEHOLDER ── */}
      <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/40">
          <Bell className="w-4 h-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">Notifications</h2>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground">{t.notImplemented}</p>
        </div>
      </section>

      {/* ── ABOUT APP ── */}
      <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/40">
          <Info className="w-4 h-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">{t.about}</h2>
            <p className="text-xs text-muted-foreground">{t.aboutSub}</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t.version}</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t.build}</span>
            <span className="text-sm font-medium">2025.03</span>
          </div>
        </div>
      </section>
    </div>
  );
}
