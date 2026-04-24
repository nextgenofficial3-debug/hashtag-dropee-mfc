import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Onboarding from "./pages/auth/Onboarding";
import AuthCallbackHandler from "./pages/auth/AuthCallbackHandler";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Discover from "./pages/Discover";
import Checkout from "./pages/Checkout";
import PickAndDrop from "./pages/PickAndDrop";
import Bookings from "./pages/Bookings";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";

// Layouts
import TopBar from "./components/layout/TopBar";
import BottomNavigation from "./components/layout/BottomNavigation";
import AdminLayout from "./components/admin/AdminLayout";
import { DownloadAppPrompt } from "./components/layout/DownloadAppPrompt";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminMenu from "./pages/admin/AdminMenu";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminWhitelist from "./pages/admin/AdminWhitelist";

const queryClient = new QueryClient();

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, authError, signOut } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm animate-pulse">Initializing secure session...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full glass rounded-3xl p-8 border border-destructive/20 text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl text-destructive">⚠️</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Authentication Issue</h2>
            <p className="text-muted-foreground text-sm">{authError}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Retry Connection
            </button>
            <button 
              onClick={signOut}
              className="w-full h-12 bg-secondary text-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isOnboarded, loading, authError, signOut } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm animate-pulse">Loading your account...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full glass rounded-3xl p-8 border border-destructive/20 text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl text-destructive">⚠️</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Wait a moment</h2>
            <p className="text-muted-foreground text-sm">{authError}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Refresh App
            </button>
            <button 
              onClick={signOut}
              className="w-full h-12 bg-secondary text-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth/login" replace />;
  
  if (!isOnboarded) return <Navigate to="/auth/onboarding" replace />;
  
  return <>{children}</>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNavigation />
    </div>
  );
}

function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedAdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedAdminRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/onboarding" element={<Onboarding />} />
            <Route path="/auth/callback" element={<AuthCallbackHandler />} />
            
            {/* Customer Routes protected by OnboardingGuard */}
            <Route path="/" element={<OnboardingGuard><MainLayout><Index /></MainLayout></OnboardingGuard>} />
            <Route path="/shop" element={<OnboardingGuard><MainLayout><Shop /></MainLayout></OnboardingGuard>} />
            <Route path="/cart" element={<OnboardingGuard><MainLayout><Cart /></MainLayout></OnboardingGuard>} />
            <Route path="/notifications" element={<OnboardingGuard><MainLayout><Notifications /></MainLayout></OnboardingGuard>} />
            <Route path="/profile" element={<OnboardingGuard><MainLayout><Profile /></MainLayout></OnboardingGuard>} />
            <Route path="/discover" element={<OnboardingGuard><MainLayout><Discover /></MainLayout></OnboardingGuard>} />
            <Route path="/checkout" element={<OnboardingGuard><Checkout /></OnboardingGuard>} />
            <Route path="/pick-and-drop" element={<OnboardingGuard><PickAndDrop /></OnboardingGuard>} />
            <Route path="/bookings" element={<OnboardingGuard><MainLayout><Bookings /></MainLayout></OnboardingGuard>} />
            <Route path="/orders" element={<OnboardingGuard><MainLayout><Orders /></MainLayout></OnboardingGuard>} />
            <Route path="/orders/:orderId" element={<OnboardingGuard><OrderTracking /></OnboardingGuard>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminPage><AdminDashboard /></AdminPage>} />
            <Route path="/admin/orders" element={<AdminPage><AdminOrders /></AdminPage>} />
            <Route path="/admin/reservations" element={<AdminPage><AdminReservations /></AdminPage>} />
            <Route path="/admin/menu" element={<AdminPage><AdminMenu /></AdminPage>} />
            <Route path="/admin/whitelist" element={<AdminPage><AdminWhitelist /></AdminPage>} />
            <Route path="/admin/settings" element={<AdminPage><AdminSettings /></AdminPage>} />
          </Routes>
          <DownloadAppPrompt />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
