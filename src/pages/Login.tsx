import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Cross, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router-dom';

const labels = {
  en: {
    welcomeBack: 'Welcome back', signInDashboard: 'Sign in to your dashboard',
    email: 'Email address', password: 'Password', signIn: 'Sign In',
    loginFailed: 'Login failed', accessInviteOnly: 'Access is by invitation only. Contact your administrator if you need access.',
    members: 'Members', contributions: 'Contributions', prayers: 'Prayers',
    bibleQuote: '"For where two or three gather in my name, there am I with them."',
    bibleRef: '— Matthew 18:20',
    // signup
    createAccount: 'Create your account',
    signUpDesc: 'You have been invited as a leader. Set up your password to get started.',
    fullName: 'Full Name',
    confirmPassword: 'Confirm Password',
    signUp: 'Sign Up',
    signUpFailed: 'Sign up failed',
    signUpSuccess: 'Account created!',
    signUpSuccessDesc: 'Please check your email to verify, then sign in.',
    passwordMismatch: 'Passwords do not match',
    alreadyHaveAccount: 'Already have an account?',
    switchToSignIn: 'Sign in',
    invalidInvite: 'Invalid or expired invitation',
    invalidInviteDesc: 'This invite link is no longer valid. Please contact your administrator.',
  },
  sw: {
    welcomeBack: 'Karibu tena', signInDashboard: 'Ingia kwenye dashibodi yako',
    email: 'Barua pepe', password: 'Nenosiri', signIn: 'Ingia',
    loginFailed: 'Kuingia kumeshindikana', accessInviteOnly: 'Ufikiaji ni kwa mwaliko tu. Wasiliana na msimamizi wako ikiwa unahitaji ufikiaji.',
    members: 'Wanachama', contributions: 'Michango', prayers: 'Sala',
    bibleQuote: '"Maana walipo wawili au watatu wamekusanyika kwa jina langu, nami nipo katikati yao."',
    bibleRef: '— Mathayo 18:20',
    createAccount: 'Fungua akaunti yako',
    signUpDesc: 'Umealikwa kuwa kiongozi. Weka nenosiri lako ili kuanza.',
    fullName: 'Jina Kamili',
    confirmPassword: 'Thibitisha Nenosiri',
    signUp: 'Jisajili',
    signUpFailed: 'Usajili umeshindikana',
    signUpSuccess: 'Akaunti imeundwa!',
    signUpSuccessDesc: 'Tafadhali angalia barua pepe yako kuthibitisha, kisha uingie.',
    passwordMismatch: 'Nenosiri hazifanani',
    alreadyHaveAccount: 'Tayari una akaunti?',
    switchToSignIn: 'Ingia',
    invalidInvite: 'Mwaliko batili au umeisha muda',
    invalidInviteDesc: 'Kiungo hiki cha mwaliko hakifanyi kazi tena. Wasiliana na msimamizi wako.',
  },
} as const;

export default function LoginPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { lang } = useAppTheme();
  const t = labels[lang];
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const inviteEmail = searchParams.get('invite') || '';
  const [isSignUp, setIsSignUp] = useState(!!inviteEmail);
  const [inviteName, setInviteName] = useState('');
  const [inviteValid, setInviteValid] = useState<boolean | null>(inviteEmail ? null : true);

  const [email, setEmail] = useState(inviteEmail);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If an invite email is provided, trust the link and allow signup.
  // The server-side handle_leader_signup trigger validates the invitation during signup.
  useEffect(() => {
    if (!inviteEmail) return;
    setInviteValid(true);
    setInviteName('');
  }, [inviteEmail]);

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: t.loginFailed, description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t.passwordMismatch, variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin + '/login',
      },
    });
    if (error) {
      toast({ title: t.signUpFailed, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t.signUpSuccess, description: t.signUpSuccessDesc });
      setIsSignUp(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(158 64% 45%))' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Cross className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl">Spiritual Friends</span>
        </div>
        <div>
          <blockquote className="text-white/90 text-2xl font-display font-semibold leading-relaxed mb-6">
            {t.bibleQuote}
          </blockquote>
          <p className="text-white/70 text-sm">{t.bibleRef}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[t.members, t.contributions, t.prayers].map((label) => (
            <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-white/60 text-xs uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Cross className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Spiritual Friends</span>
          </div>

          {/* Invalid invite */}
          {inviteEmail && inviteValid === false && (
            <div className="text-center py-10">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">{t.invalidInvite}</h1>
              <p className="text-muted-foreground">{t.invalidInviteDesc}</p>
            </div>
          )}

          {/* Loading invite check */}
          {inviteEmail && inviteValid === null && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* Sign Up form */}
          {isSignUp && inviteValid === true && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">{t.createAccount}</h1>
                <p className="text-muted-foreground">{t.signUpDesc}</p>
              </div>
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label>{t.fullName}</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. John Kamau" required />
                </div>
                <div className="space-y-2">
                  <Label>{t.email}</Label>
                  <Input type="email" value={email} readOnly={!!inviteEmail} className={inviteEmail ? 'bg-muted' : ''} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t.password}</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t.confirmPassword}</Label>
                  <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t.signUp}
                </Button>
              </form>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {t.alreadyHaveAccount}{' '}
                <button onClick={() => setIsSignUp(false)} className="text-primary font-medium hover:underline">{t.switchToSignIn}</button>
              </p>
            </>
          )}

          {/* Sign In form */}
          {!isSignUp && (inviteValid === true || !inviteEmail) && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">{t.welcomeBack}</h1>
                <p className="text-muted-foreground">{t.signInDashboard}</p>
              </div>
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input id="email" type="email" placeholder="leader@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t.password}</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t.signIn}
                </Button>
              </form>
              <p className="mt-6 text-center text-xs text-muted-foreground">{t.accessInviteOnly}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
