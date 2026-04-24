import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Mail,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// These two are always protected — can never be removed via UI
const HARDCODED_ADMINS = [
  { email: "hashtagdropee@gmail.com", role: "super_admin" },
  { email: "makyoningshen4@gmail.com", role: "admin" },
];

interface AdminEntry {
  id: string;
  email: string;
  role: string;
  created_at: string;
  isHardcoded?: boolean;
}

export default function AdminWhitelist() {
  const [loading, setLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState(true);
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [submitting, setSubmitting] = useState(false);

  /* ── Load from DB, fallback gracefully ─────────── */
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mfc_admin_whitelist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDbAvailable(true);
      // Merge DB rows with hardcoded rows (deduplicate by email)
      const dbRows: AdminEntry[] = (data ?? []).map((r: any) => ({
        ...r,
        isHardcoded: HARDCODED_ADMINS.some(
          (h) => h.email === r.email
        ),
      }));
      const dbEmails = dbRows.map((r) => r.email);

      // Prepend hardcoded admins that are NOT already in the DB
      const extraHardcoded: AdminEntry[] = HARDCODED_ADMINS.filter(
        (h) => !dbEmails.includes(h.email)
      ).map((h, i) => ({
        id: `hardcoded-${i}`,
        email: h.email,
        role: h.role,
        created_at: new Date().toISOString(),
        isHardcoded: true,
      }));

      setAdmins([...extraHardcoded, ...dbRows]);
    } catch {
      setDbAvailable(false);
      // Show hardcoded list only
      setAdmins(
        HARDCODED_ADMINS.map((h, i) => ({
          id: `hardcoded-${i}`,
          email: h.email,
          role: h.role,
          created_at: new Date().toISOString(),
          isHardcoded: true,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  /* ── Add ────────────────────────────────────────── */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("mfc_admin_whitelist")
        .insert({ email: newEmail.trim().toLowerCase(), role: newRole });
      if (error) throw error;
      toast.success("Admin added to whitelist");
      setNewEmail("");
      fetchAdmins();
    } catch (err: any) {
      toast.error("Failed to add admin: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Remove ─────────────────────────────────────── */
  const handleRemove = async (admin: AdminEntry) => {
    if (admin.isHardcoded) {
      toast.error("Core admin accounts cannot be removed here.");
      return;
    }
    if (!confirm(`Remove ${admin.email} from admin whitelist?`)) return;
    try {
      const { error } = await supabase
        .from("mfc_admin_whitelist")
        .delete()
        .eq("id", admin.id);
      if (error) throw error;
      toast.success("Admin removed");
      fetchAdmins();
    } catch (err: any) {
      toast.error("Failed to remove admin");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 text-zinc-500" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Admin Whitelist
        </h1>
        <p className="text-zinc-400">
          Manage who has access to this Command Center.
        </p>
      </div>

      {/* DB unavailable banner */}
      {!dbAvailable && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Database table not found</p>
            <p className="text-amber-400/70">
              The <code className="font-mono text-xs bg-amber-500/20 px-1 py-0.5 rounded">mfc_admin_whitelist</code> table
              does not exist yet. Run the SQL below in Supabase to enable
              persistent whitelist management. Hardcoded admins are still
              active.
            </p>
            <pre className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">
{`create table public.mfc_admin_whitelist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'admin',
  created_at timestamptz default now()
);
alter table public.mfc_admin_whitelist enable row level security;
create policy "Public read" on public.mfc_admin_whitelist
  for select using (true);
create policy "Admin write" on public.mfc_admin_whitelist
  for all using (auth.role() = 'authenticated');`}
            </pre>
          </div>
        </div>
      )}

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
          <Button
            type="submit"
            disabled={submitting || !dbAvailable}
            className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Authorize"
            )}
          </Button>
        </form>
        {!dbAvailable && (
          <p className="text-xs text-amber-400/70 mt-2">
            ⚠ Create the table in Supabase first to add new admins here.
          </p>
        )}
      </div>

      {/* Admin List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950 text-zinc-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Email Address</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Source</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {admins.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-10 text-zinc-500 text-sm"
                >
                  No admins in whitelist.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-200 font-medium flex items-center gap-2">
                    {admin.isHardcoded && (
                      <ShieldCheck className="w-4 h-4 text-[#FF5A00] shrink-0" />
                    )}
                    {admin.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                        admin.role === "super_admin"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {admin.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-medium ${
                        admin.isHardcoded
                          ? "bg-[#FF5A00]/20 text-[#FF5A00]"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {admin.isHardcoded ? "Hardcoded" : "Database"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(admin)}
                      disabled={admin.isHardcoded}
                      title={
                        admin.isHardcoded
                          ? "Core admin — cannot remove"
                          : "Remove admin"
                      }
                      className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
