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
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthChange = async (session: Session | null) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await checkAdminStatus(currentUser.email);
      } else {
        setRole(null);
        setLoading(false);
      }
    };

    // Initial fetch
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        handleAuthChange(session);
      })
      .catch((err) => {
        console.error("Session fetch failed", err);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleAuthChange(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (email: string | undefined) => {
    // Super admin bypass
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
      console.error("Failed to fetch admin status", err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = role === "admin" || role === "super_admin";
  const isOnboarded = !!user?.user_metadata?.onboarded;

  return (
    <AuthContext.Provider value={{ user, session, role, isAdmin, isOnboarded, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
