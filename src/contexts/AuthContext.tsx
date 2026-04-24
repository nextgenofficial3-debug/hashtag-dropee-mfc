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

async function resolveRole(user: User): Promise<UserRole | null> {
  try {
    // 1. Check explicit user_roles table first (most authoritative)
    const { data: explicitRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError) {
      console.warn("[AuthContext] user_roles query failed:", roleError.message);
    }

    if (explicitRole?.role) {
      return explicitRole.role as UserRole;
    }

    // 2. Fall back to email whitelist (for admins added before user_roles was set up)
    if (user.email) {
      const { data: whitelistRole, error: wlError } = await supabase
        .from("mfc_admin_whitelist")
        .select("role")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();

      if (wlError) {
        console.warn("[AuthContext] mfc_admin_whitelist query failed:", wlError.message);
      }

      if (whitelistRole?.role) {
        return whitelistRole.role as UserRole;
      }
    }

    // 3. Also check role_invitations for granted roles
    if (user.email) {
      const { data: inviteRole, error: invError } = await supabase
        .from("role_invitations")
        .select("role")
        .eq("email", user.email.toLowerCase())
        .not("granted_at", "is", null)
        .maybeSingle();

      if (invError) {
        console.warn("[AuthContext] role_invitations query failed:", invError.message);
      }

      if (inviteRole?.role) {
        return inviteRole.role as UserRole;
      }
    }

    return null;
  } catch (error) {
    console.error("[AuthContext] resolveRole unexpected error:", error);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshRole = useCallback(async () => {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;
    const resolvedRole = await resolveRole(currentUser);
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

      localStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("[AuthContext] signOut error:", error.message);
      }
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
