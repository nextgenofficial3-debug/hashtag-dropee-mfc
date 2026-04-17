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

    // Safety timeout — forces setLoading(false) after 5 s if INITIAL_SESSION never fires
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn("MFC: INITIAL_SESSION never fired — forcing loading=false");
        setAuthError("Authentication is taking longer than expected.");
        setLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log(`🔐 MFC Auth Event [${event}]`);

        if (event === "INITIAL_SESSION") {
          // Clear the safety timer — we got a real response
          clearTimeout(safetyTimer);

          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            await checkAdminStatus(currentUser.email);
          } else {
            setRole(null);
          }

          // setLoading(false) ONLY here — on INITIAL_SESSION
          if (mounted) setLoading(false);

        } else if (event === "SIGNED_IN") {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          if (currentUser && mounted) {
            await checkAdminStatus(currentUser.email);
          }

        } else if (event === "SIGNED_OUT") {
          if (mounted) {
            setSession(null);
            setUser(null);
            setRole(null);
          }

        } else if (event === "TOKEN_REFRESHED") {
          if (mounted) setSession(currentSession);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
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
