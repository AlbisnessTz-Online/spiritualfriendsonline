import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [roleChecked, setRoleChecked] = useState(false);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    if (!user) { setRoleChecked(true); return; }
    supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => {
        setHasRole((data?.length ?? 0) > 0);
        setRoleChecked(true);
      });
  }, [user]);

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!hasRole) {
    // User is authenticated but has no assigned role — sign them out and redirect
    supabase.auth.signOut();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
