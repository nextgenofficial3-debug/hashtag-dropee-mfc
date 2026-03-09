import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AdminProvider } from "@/contexts/AdminContext";
import CinematicLoader from "@/components/common/CinematicLoader";

// Lazy-loaded pages — each becomes its own chunk
const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const Checkout = lazy(() => import("./pages/Checkout"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Install = lazy(() => import("./pages/Install"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages — rarely visited by customers, split separately
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<CinematicLoader />}>
              <Routes>
                {/* Customer Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/install" element={<Install />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/notifications" element={<Notifications />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/promotions" element={<AdminPromotions />} />
                  <Route path="/admin/coupons" element={<AdminCoupons />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/notifications" element={<AdminNotifications />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/admin/content" element={<AdminContent />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
