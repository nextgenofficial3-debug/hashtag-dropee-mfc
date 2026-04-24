import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  refreshRole: () => Promise<void>;
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
  refreshRole: async () => undefined,
});

export const useAuth = () => useContext(AuthContext);

// ── ADMIN EMAILS ──────────────────────────────────────────────────────────────
// Add admin email addresses here. This is the fallback when app_metadata
// hasn't been set in Supabase yet. To make it permanent, set app_metadata.role
// = "admin" for each admin user via Supabase Dashboard → Authentication → Users.
const ADMIN_EMAILS: string[] = [
  "hashtagdropee@gmail.com",
  "makyoningshen4@gmail.com",
];

async function resolveRole(user: User): Promise<UserRole | null> {
  // ── Step 1: Trust app_metadata.role (set server-side by Supabase/triggers) ──
  // This is the gold standard — never overwritten by Google OAuth.
  const appRole = user.app_metadata?.role as string | undefined;
  if (appRole && ["admin", "super_admin", "moderator", "agent", "user"].includes(appRole)) {
    console.log("[AuthContext] role from app_metadata:", appRole);
    return appRole as UserRole;
  }

  // ── Step 2: Check user_roles table (with timeout guard) ───────────────────
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 3000)
    );
    const query = supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: roleRow, error: roleError } = await Promise.race([
      query,
      timeout,
    ]);

    if (roleError) {
      console.warn("[AuthContext] user_roles query failed (RLS?):", roleError.message);
    } else if (roleRow?.role) {
      console.log("[AuthContext] role from user_roles:", roleRow.role);
      return roleRow.role as UserRole;
    }
  } catch (err) {
    console.warn("[AuthContext] user_roles timed out or error:", err);
  }

  // ── Step 3: Hardcoded email fallback ─────────────────────────────────────
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    console.log("[AuthContext] role from email whitelist:", user.email);
    return "admin";
  }

  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshRole = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;
    if (!currentUser) return;
    const resolvedRole = await resolveRole(currentUser);
    console.log("[AuthContext] refreshRole result:", resolvedRole);
    setRole(resolvedRole);
  }, []);

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
          console.log("[AuthContext] onAuthStateChange role:", resolvedRole, "event:", event);
          if (mounted) setRole(resolvedRole);
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
        if (mounted) setLoading(false);
      }

      if (event === "SIGNED_IN" && "caches" in window) {
        void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
      }
    });

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

      // Only clear MFC-specific keys, NOT all localStorage
      // (clearing all breaks profile/address data that is stored there)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith("mfc_profile_") && !key.startsWith("mfc_addresses_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      const { error } = await supabase.auth.signOut();
      if (error) console.warn("[AuthContext] signOut error:", error.message);
    } catch (error) {
      console.warn("[AuthContext] signOut exception:", error);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  const isAdmin = role === "admin" || role === "super_admin";
  const isOnboarded = Boolean(user?.user_metadata?.onboarded);

  return (
    <AuthContext.Provider
      value={{ user, session, role, isAdmin, isOnboarded, loading, authError, signInWithGoogle, signOut, refreshRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};
