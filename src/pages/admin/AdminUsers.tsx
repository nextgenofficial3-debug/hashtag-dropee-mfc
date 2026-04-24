import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Users, ShoppingBag, TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UserProfileRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface OrderRow {
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total: number | null;
  created_at: string;
}

interface UserSummary {
  user_id: string;
  order_count: number;
  total_spent: number;
  last_order: string | null;
  customer_name: string;
  customer_phone: string;
  email: string;
  created_at: string | null;
  last_sign_in_at: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [{ data: profileRows, error: profileError }, { data: orderRows, error: orderError }] = await Promise.all([
        (supabase.from("mfc_user_profiles" as any) as any)
          .select("user_id, email, full_name, phone, avatar_url, created_at, last_sign_in_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("mfc_orders")
          .select("user_id, customer_name, customer_phone, total, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (profileError) throw profileError;
      if (orderError) throw orderError;

      const map = new Map<string, UserSummary>();

      for (const profile of (profileRows || []) as UserProfileRow[]) {
        map.set(profile.user_id, {
          user_id: profile.user_id,
          order_count: 0,
          total_spent: 0,
          last_order: null,
          customer_name: profile.full_name || profile.email?.split("@")[0] || "Customer",
          customer_phone: profile.phone || "",
          email: profile.email || "",
          created_at: profile.created_at,
          last_sign_in_at: profile.last_sign_in_at,
        });
      }

      for (const order of (orderRows || []) as OrderRow[]) {
        const key = order.user_id || `guest:${order.customer_phone || order.customer_name || order.created_at}`;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            user_id: key,
            order_count: 1,
            total_spent: Number(order.total || 0),
            last_order: order.created_at,
            customer_name: order.customer_name || "Guest customer",
            customer_phone: order.customer_phone || "",
            email: "",
            created_at: null,
            last_sign_in_at: null,
          });
        } else {
          existing.order_count += 1;
          existing.total_spent += Number(order.total || 0);
          existing.last_order = existing.last_order || order.created_at;
          if (!existing.customer_phone && order.customer_phone) existing.customer_phone = order.customer_phone;
          if (existing.customer_name === "Customer" && order.customer_name) existing.customer_name = order.customer_name;
        }
      }

      setUsers(Array.from(map.values()).sort((a, b) => b.order_count - a.order_count));
    } catch (err: any) {
      toast.error("Failed to load users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const needle = search.toLowerCase();
    return (
      u.customer_name.toLowerCase().includes(needle) ||
      u.customer_phone.includes(search) ||
      u.email.toLowerCase().includes(needle) ||
      u.user_id.toLowerCase().includes(needle)
    );
  });

  const totalRevenue = users.reduce((acc, u) => acc + u.total_spent, 0);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-3">
          <Users className="w-8 h-8 text-[#FF5A00]" /> Users
        </h1>
        <p className="text-zinc-400 mt-1">Signed-up Supabase users plus guest customers from orders.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-[#FF5A00]">{users.length}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Customers</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-green-400">Rs {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Total Revenue</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center col-span-2 md:col-span-1">
          <p className="text-2xl font-extrabold text-zinc-100">
            {users.length > 0 ? `Rs ${Math.round(totalRevenue / users.length).toLocaleString()}` : "-"}
          </p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><ShoppingBag className="w-3 h-3" /> Avg Spend/User</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, or ID..."
          className="bg-zinc-900 border-zinc-800 pl-10" />
      </div>

      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4 text-center">Orders</th>
              <th className="px-6 py-4">Total Spent</th>
              <th className="px-6 py-4">Last Seen</th>
              <th className="px-6 py-4 text-right">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-zinc-500">No customers found.</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.user_id} className="hover:bg-zinc-800/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FF5A00]/20 flex items-center justify-center text-[#FF5A00] font-bold text-sm shrink-0">
                      {u.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-zinc-200">{u.customer_name}</span>
                      {u.email ? <p className="text-xs text-zinc-500">{u.email}</p> : null}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-400">{u.customer_phone || "-"}</td>
                <td className="px-6 py-4 text-center">
                  <span className={cn("px-2.5 py-1 rounded-lg font-bold text-sm",
                    u.order_count >= 5 ? "bg-green-500/20 text-green-400" :
                    u.order_count >= 2 ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-400")}>
                    {u.order_count}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-green-400">Rs {u.total_spent.toLocaleString()}</td>
                <td className="px-6 py-4 text-zinc-500 text-xs">
                  {u.last_order ? new Date(u.last_order).toLocaleDateString() : u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "-"}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-mono text-[10px] text-zinc-700">{u.user_id.slice(0, 8)}...</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.length === 0
          ? <div className="text-center py-12 text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">No customers found.</div>
          : filtered.map((u) => (
            <div key={u.user_id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#FF5A00]/20 flex items-center justify-center text-[#FF5A00] font-bold shrink-0">
                  {u.customer_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-200 truncate">{u.customer_name}</p>
                  <p className="text-xs text-zinc-500 truncate">{u.email || u.customer_phone || u.user_id}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-950 rounded-lg p-2">
                  <p className="text-sm font-bold text-zinc-200">{u.order_count}</p>
                  <p className="text-[10px] text-zinc-600">Orders</p>
                </div>
                <div className="bg-zinc-950 rounded-lg p-2">
                  <p className="text-sm font-bold text-green-400">Rs {u.total_spent.toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-600">Spent</p>
                </div>
                <div className="bg-zinc-950 rounded-lg p-2">
                  <p className="text-sm font-bold text-zinc-400">{u.last_order ? new Date(u.last_order).toLocaleDateString() : "-"}</p>
                  <p className="text-[10px] text-zinc-600">Last</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
