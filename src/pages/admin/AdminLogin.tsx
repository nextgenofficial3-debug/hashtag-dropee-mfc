import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isAdmin, isLoading, user } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);

  useEffect(() => {
    if (user && isAdmin && !isLoading) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
    // OAuth redirect handles the rest
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await login(email, password);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Welcome back!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Store
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>
              Sign in with your authorized Google account to manage MFC store
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google Sign-In — primary method */}
            <button
              id="mfc-admin-google-signin"
              onClick={handleGoogleLogin}
              className="w-full h-12 rounded-lg bg-white text-gray-800 font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow border border-gray-200"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {/* Divider with fallback */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => setUsePassword(!usePassword)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {usePassword ? 'Hide password login' : 'Use email & password'}
              </button>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Legacy email/password fallback (collapsed by default) */}
            {usePassword && (
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mfc.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In with Password'}
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Only authorized Gmail accounts can access this panel.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
