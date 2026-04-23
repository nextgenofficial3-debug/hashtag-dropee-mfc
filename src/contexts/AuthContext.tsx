import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
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
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined,
});

export const useAuth = () => useContext(AuthContext);

async function resolveRole(user: User): Promise<UserRole | null> {
  const [{ data: explicitRole }, { data: whitelistRole }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    user.email
      ? supabase.from("mfc_admin_whitelist").select("role").eq("email", user.email.toLowerCase()).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const role = (explicitRole?.role || whitelistRole?.role) as UserRole | undefined;
  return role || null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setAuthError(null);
      setSession(currentSession);

      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      try {
        if (currentUser) {
          const resolvedRole = await resolveRole(currentUser);
          if (mounted) {
            setRole(resolvedRole);
          }
        } else {
          setRole(null);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to verify session";
        if (mounted) {
          setAuthError(message);
          setRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }

      if (event === "SIGNED_IN" && "caches" in window) {
        void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
      }
    });

    const fallback = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
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
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start Google sign-in";
      setAuthError(message);
    }
  };

  const signOut = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      await supabase.auth.signOut();
    } finally {
      window.location.href = "/auth/login";
    }
  };

  const isAdmin = role === "admin" || role === "super_admin";
  const isOnboarded = Boolean(user?.user_metadata?.onboarded);

  return (
    <AuthContext.Provider value={{ user, session, role, isAdmin, isOnboarded, loading, authError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
