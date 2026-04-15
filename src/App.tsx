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
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";

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
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isOnboarded, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent" /></div>;
  
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
            
            {/* Customer Routes protected by OnboardingGuard */}
            <Route path="/" element={<OnboardingGuard><MainLayout><Index /></MainLayout></OnboardingGuard>} />
            <Route path="/shop" element={<OnboardingGuard><MainLayout><Shop /></MainLayout></OnboardingGuard>} />
            <Route path="/cart" element={<OnboardingGuard><MainLayout><Cart /></MainLayout></OnboardingGuard>} />
            <Route path="/profile" element={<OnboardingGuard><MainLayout><Profile /></MainLayout></OnboardingGuard>} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/orders" element={<AdminOrders />} />
                      <Route path="/reservations" element={<AdminReservations />} />
                      <Route path="/menu" element={<AdminMenu />} />
                      <Route path="/whitelist" element={<AdminWhitelist />} />
                      <Route path="/settings" element={<AdminSettings />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedAdminRoute>
              } 
            />
          </Routes>
          <DownloadAppPrompt />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
