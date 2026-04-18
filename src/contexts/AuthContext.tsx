import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "moderator" | "agent" | "user" | "super_admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isAdmin: boolean;
  isOnboarded: boolean;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  isAdmin: false,
  isOnboarded: false,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAdminStatus = async (email: string | undefined) => {
    if (email === "hashtagdropee@gmail.com") {
      setRole("super_admin");
      return;
    }

    if (!email) {
      setRole(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("mfc_admin_whitelist")
        .select("role")
        .eq("email", email)
        .single();

      if (data && !error) {
        setRole(data.role as UserRole);
      } else {
        setRole(null);
      }
    } catch (err) {
      console.error("Failed to fetch admin status MFC", err);
      setRole(null);
    }
    // Note: NO setLoading(false) here — loading is only cleared in INITIAL_SESSION handler
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            await checkAdminStatus(currentUser.email);
          } else {
            setRole(null);
          }

          // Clear stale cache on sign in
          if (event === 'SIGNED_IN' && 'caches' in window) {
            caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
          }
          if (mounted) setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setRole(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
        }
      }
    );

    // Hard fallback — never spin forever
    const fallback = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google sign-in error MFC:", err);
      setAuthError(err.message || "Failed to start Google sign-in");
    }
  };

  const signOut = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/login'; // hard redirect always
    }
  };

  const isAdmin = role === "admin" || role === "super_admin";
  const isOnboarded = !!user?.user_metadata?.onboarded;

  return (
    <AuthContext.Provider value={{ user, session, role, isAdmin, isOnboarded, loading, authError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
