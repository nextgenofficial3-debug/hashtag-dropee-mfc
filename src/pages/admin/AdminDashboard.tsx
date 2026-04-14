import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, Tag, DollarSign, TrendingUp, ShoppingCart, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/hooks/useProducts';
import { usePromotions, useActivePromotions } from '@/hooks/usePromotions';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { data: products } = useProducts();
  const { data: promotions } = usePromotions();
  const { data: activePromotions } = useActivePromotions();
  const { data: settings } = useStoreSettings();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('mfc_orders')
        .select('id, total, status, created_at')
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) || []);
    };
    fetchOrders();
  }, []);

  const now = new Date();

  const analytics = useMemo(() => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyOrders = orders.filter(o => new Date(o.created_at) >= startOfWeek);
    const monthlyOrders = orders.filter(o => new Date(o.created_at) >= startOfMonth);

    const sum = (arr: Order[]) => arr.reduce((s, o) => s + Number(o.total), 0);
    const delivered = (arr: Order[]) => arr.filter(o => o.status === 'delivered');

    return {
      overall: { total: orders.length, revenue: sum(orders), delivered: delivered(orders).length },
      monthly: { total: monthlyOrders.length, revenue: sum(monthlyOrders), delivered: delivered(monthlyOrders).length },
      weekly: { total: weeklyOrders.length, revenue: sum(weeklyOrders), delivered: delivered(weeklyOrders).length },
    };
  }, [orders, now]);

  const stats = [
    { title: 'Total Products', value: products?.length || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'In Stock', value: products?.filter(p => p.in_stock).length || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Active Promotions', value: activePromotions?.length || 0, icon: Tag, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Store Status', value: settings?.is_open ? 'Open' : 'Closed', icon: DollarSign, color: settings?.is_open ? 'text-green-600' : 'text-red-600', bg: settings?.is_open ? 'bg-green-100' : 'bg-red-100' },
  ];

  const renderAnalyticsCards = (data: { total: number; revenue: number; delivered: number }) => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-blue-100">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{data.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">₹{data.revenue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold">{data.delivered}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to MFC Admin Panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Order Analytics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Order Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overall">
                <TabsList className="mb-4">
                  <TabsTrigger value="overall">Overall</TabsTrigger>
                  <TabsTrigger value="monthly">This Month</TabsTrigger>
                  <TabsTrigger value="weekly">This Week</TabsTrigger>
                </TabsList>
                <TabsContent value="overall">{renderAnalyticsCards(analytics.overall)}</TabsContent>
                <TabsContent value="monthly">{renderAnalyticsCards(analytics.monthly)}</TabsContent>
                <TabsContent value="weekly">{renderAnalyticsCards(analytics.weekly)}</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products?.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <span>🍗</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">₹{product.price}</p>
                      </div>
                    </div>
                    <Badge variant={product.in_stock ? "default" : "destructive"}>
                      {product.in_stock ? 'In Stock' : 'Out'}
                    </Badge>
                  </div>
                ))}
                {(!products || products.length === 0) && (
                  <p className="text-muted-foreground text-sm">No products yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Promotions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activePromotions?.map((promo) => (
                  <div key={promo.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{promo.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {promo.applies_to_all ? 'All Products' : 'Selected Products'}
                      </p>
                    </div>
                    <Badge className="bg-secondary text-secondary-foreground">
                      {promo.discount_percentage}% OFF
                    </Badge>
                  </div>
                ))}
                {(!activePromotions || activePromotions.length === 0) && (
                  <p className="text-muted-foreground text-sm">No active promotions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminSidebar>
  );
};

export default AdminDashboard;
