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
      setLoading(false);
      return;
    }

    if (!email) {
      setRole(null);
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout — 6 s max
    const authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("⚠️ Auth initialization timeout in MFC");
        setAuthError("Authentication is taking longer than expected.");
        setLoading(false);
      }
    }, 6000);

    // ─── SINGLE SOURCE OF TRUTH ──────────────────────────────────────────────
    // onAuthStateChange fires INITIAL_SESSION on page load — this fully
    // replaces the old getSession() + onAuthStateChange dual-trigger pattern
    // that caused race conditions and infinite loading states.
    // ─────────────────────────────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        console.log(`🔐 MFC Auth Event [${event}]`);
        clearTimeout(authTimeout);

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await checkAdminStatus(currentUser.email);
        } else {
          setRole(null);
          if (isMounted) setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
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
    await supabase.auth.signOut();
    setRole(null);
    setUser(null);
    setSession(null);
  };

  const isAdmin = role === "admin" || role === "super_admin";
  const isOnboarded = !!user?.user_metadata?.onboarded;

  return (
    <AuthContext.Provider value={{ user, session, role, isAdmin, isOnboarded, loading, authError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
