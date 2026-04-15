import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { signInWithGoogle, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, isAdmin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[100px] z-0 pointer-events-none" />
      
      <div className="max-w-md w-full glass rounded-3xl p-8 z-10 border border-border/50 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-primary/30">
            <span className="text-4xl text-primary font-bold tracking-tighter">HD</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to FoodApp</h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in securely to manage your orders</p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={signInWithGoogle} 
            className="w-full h-14 text-base font-semibold rounded-2xl flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-100 hover:scale-[1.02] transition-all"
            variant="outline"
          >
            <Chrome className="w-5 h-5 text-blue-600" />
            Continue with Google
          </Button>
          
          <div className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service & Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
