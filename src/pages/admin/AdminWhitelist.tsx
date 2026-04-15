import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ShieldCheck, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminWhitelist() {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("admin");

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("mfc_admin_whitelist")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setAdmins(data || []);
    } catch (err: any) {
      toast.error("Failed to load admins: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      const { error } = await supabase
        .from("mfc_admin_whitelist")
        .insert({ email: newEmail.toLowerCase(), role: newRole });
        
      if (error) throw error;
      toast.success("Admin added to whitelist");
      setNewEmail("");
      fetchAdmins();
    } catch (err: any) {
      toast.error("Failed to add admin: " + err.message);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;

    try {
      const { error } = await supabase
        .from("mfc_admin_whitelist")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      toast.success("Admin removed");
      fetchAdmins();
    } catch (err: any) {
      toast.error("Failed to remove admin");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-8 text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Whitelist</h1>
        <p className="text-zinc-400">Manage who has access to this Command Center.</p>
      </div>

      {/* Add New Admin */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-[#FF5A00]" /> Add Authorized Admin
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input 
              type="email"
              placeholder="admin@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-zinc-950 border-zinc-800 pl-10"
              required
            />
          </div>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="w-full sm:w-40 bg-zinc-950 border-zinc-800">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold">
            Authorize
          </Button>
        </form>
      </div>

      {/* Admin List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950 text-zinc-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Email Address</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Date Added</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 text-zinc-200 font-medium">{admin.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                    admin.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {admin.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-500 text-sm">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemove(admin.id)}
                    className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                    disabled={admin.email === 'hashtagdropee@gmail.com'}
                  >
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
