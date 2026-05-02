import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard, Users, CreditCard, FileText, BookOpen,
  Upload, LogOut, Menu, X, Cross, Crown, Smartphone, Star, Settings, Mail, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navLabels = {
  en: {
    dashboard: 'Dashboard', members: 'Members', transactions: 'Transactions',
    leaders: 'Leaders', smsImport: 'SMS Import', autoSms: 'Auto SMS',
    reports: 'Reports', dailyPrayer: 'Daily Prayer', about: 'About',
    settings: 'Settings', subscribers: 'Subscribers', assistant: 'AI Assistant',
    signedIn: 'Signed in as', signOut: 'Sign Out',
    system: 'Management System',
  },
  sw: {
    dashboard: 'Dashibodi', members: 'Wanachama', transactions: 'Miamala',
    leaders: 'Viongozi', smsImport: 'Ingiza SMS', autoSms: 'SMS Otomatiki',
    reports: 'Ripoti', dailyPrayer: 'Sala ya Kila Siku', about: 'Kuhusu',
    settings: 'Mipangilio', subscribers: 'Wajiandikishaji', assistant: 'Msaidizi wa AI',
    signedIn: 'Umeingia kama', signOut: 'Ondoka',
    system: 'Mfumo wa Usimamizi',
  },
} as const;


export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user } = useAuth();
  const { lang } = useAppTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = navLabels[lang];

  const navItems = [
    { label: t.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { label: t.members, href: '/members', icon: Users },
    { label: t.transactions, href: '/transactions', icon: CreditCard },
    { label: t.leaders, href: '/leaders', icon: Crown },
    { label: t.smsImport, href: '/sms-import', icon: Upload },
    { label: t.autoSms, href: '/sms-webhook', icon: Smartphone },
    { label: t.reports, href: '/reports', icon: FileText },
    { label: t.dailyPrayer, href: '/prayers', icon: BookOpen },
    { label: t.assistant, href: '/assistant', icon: Sparkles },
    { label: t.subscribers, href: '/subscribers', icon: Mail },
    { label: t.about, href: '/about', icon: Star },
    { label: t.settings, href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Cross className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-white leading-tight">Spiritual Friends</p>
            <p className="text-xs text-sidebar-foreground/60">{t.system}</p>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wide font-medium">{t.signedIn}</p>
            <p className="text-sm text-sidebar-foreground/90 truncate mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-red-400 transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Cross className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-sm">Spiritual Friends</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
