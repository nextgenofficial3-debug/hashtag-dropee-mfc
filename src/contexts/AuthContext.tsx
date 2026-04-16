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

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;

    const handleAuthChange = async (currentSession: Session | null) => {
      try {
        console.log("Auth state change detected in MFC:", !!currentSession);
        
        // Clear any existing timeout since we got a response
        if (authTimeout) clearTimeout(authTimeout);

        if (!isMounted) return;

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          console.log("Checking admin status for:", currentUser.email);
          await checkAdminStatus(currentUser.email);
        } else {
          setRole(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in handleAuthChange MFC:", error);
        if (isMounted) {
          setAuthError("Failed to initialize authentication. Please try again.");
          setLoading(false);
        }
      }
    };

    // Set a safety timeout - if auth hasn't resolved in 8 seconds, force stop loading
    authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.error("Auth initialization timeout in MFC");
        setAuthError("Authentication is taking longer than expected. Please check your connection.");
        setLoading(false);
      }
    }, 8000);

    // Initial fetch
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (isMounted) handleAuthChange(session);
      })
      .catch((err) => {
        console.error("Session fetch failed MFC", err);
        if (isMounted) {
          setAuthError("Failed to connect to authentication service.");
          setLoading(false);
        }
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isMounted) await handleAuthChange(session);
      }
    );

    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

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
      // Don't set hard authError here, just log and treat as non-admin
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
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
