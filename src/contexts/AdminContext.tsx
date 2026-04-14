import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface AdminContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cache only positive admin checks for speed (avoid caching false so role grants can take effect).
  const adminTrueCacheRef = useRef<Record<string, true>>({});

  const checkAdminRole = useCallback(async (userId: string) => {
    if (adminTrueCacheRef.current[userId]) return true;

    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });

      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }

      const isAdminUser = data === true;
      if (isAdminUser) adminTrueCacheRef.current[userId] = true;
      return isAdminUser;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }, []);

  // Keep auth listener synchronous: only set session/user/loading here.
  // Role verification happens in a separate effect.
  useEffect(() => {
    let isMounted = true;

    const applySession = (session: Session | null) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setIsAdmin(false);
        setIsLoading(false);
      } else {
        // We have a user; role check will determine access.
        setIsLoading(true);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      applySession(session);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        applySession(session);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Verify role whenever we have a user.
  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!user) return;

      // Fast path: if we've already confirmed admin for this user, don't re-check.
      if (adminTrueCacheRef.current[user.id]) {
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const adminStatus = await checkAdminRole(user.id);
      if (cancelled) return;

      setIsAdmin(adminStatus);
      setIsLoading(false);

      // If a non-admin is signed in, force logout.
      if (!adminStatus) {
        await supabase.auth.signOut();
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [user, checkAdminRole]);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      const nextUser = data.user ?? null;
      if (!nextUser) {
        setIsLoading(false);
        return { error: 'Login failed. Please try again.' };
      }

      const adminStatus = await checkAdminRole(nextUser.id);
      if (!adminStatus) {
        await supabase.auth.signOut();
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return { error: 'You do not have admin access' };
      }

      // Set state immediately so redirect happens without waiting for the auth listener.
      adminTrueCacheRef.current[nextUser.id] = true;
      setUser(nextUser);
      setIsAdmin(true);
      setIsLoading(false);

      return { error: null };
    } catch (_error) {
      setIsLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin/dashboard`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsLoading(false);
  };

  return (
    <AdminContext.Provider value={{ user, isAdmin, isLoading, login, loginWithGoogle, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
