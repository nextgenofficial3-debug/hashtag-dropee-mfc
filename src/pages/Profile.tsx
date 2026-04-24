import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Clock,
  Edit2,
  Home,
  LogOut,
  MapPin,
  Plus,
  Receipt,
  ShieldAlert,
  Star,
  Trash2,
  User,
  Briefcase,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { UserAddress } from "@/types/app";

const ADDRESS_TYPES = ["Home", "Work", "Other"] as const;
type AddressType = (typeof ADDRESS_TYPES)[number];

const addressTypeIcon: Record<AddressType, React.ReactNode> = {
  Home: <Home className="w-4 h-4" />,
  Work: <Briefcase className="w-4 h-4" />,
  Other: <MapPin className="w-4 h-4" />,
};

interface AddressFormState {
  full_address: string;
  address_type: AddressType;
  is_default: boolean;
}

const defaultAddressForm: AddressFormState = {
  full_address: "",
  address_type: "Home",
  is_default: false,
};

export default function Profile() {
  const { user, signOut, isAdmin, refreshRole } = useAuth();
  const navigate = useNavigate();
  const { orders } = useCustomerOrders(user?.id);

  // Profile fields
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Address management
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressDialog, setAddressDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    editId?: string;
    form: AddressFormState;
  }>({ open: false, mode: "add", form: defaultAddressForm });
  const [addressSaving, setAddressSaving] = useState(false);

  // ── Load profile data ──────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!user) return;
    setName(user.user_metadata?.full_name || "");
    setPhone(user.user_metadata?.phone || "");
  }, [user]);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    setAddressLoading(true);
    const { data } = await supabase
      .from("mfc_user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    setAddresses((data as UserAddress[]) || []);
    setAddressLoading(false);
  }, [user]);

  useEffect(() => {
    void loadProfile();
    void loadAddresses();
    // Also re-check admin role in case it wasn't resolved yet
    void refreshRole?.();
  }, [loadProfile, loadAddresses, refreshRole]);

  // ── Save profile (name + phone) ────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name, phone },
      });
      if (error) throw error;
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Address helpers ────────────────────────────────────────────────────────
  const openAddDialog = () => {
    setAddressDialog({ open: true, mode: "add", form: { ...defaultAddressForm } });
  };

  const openEditDialog = (addr: UserAddress) => {
    setAddressDialog({
      open: true,
      mode: "edit",
      editId: addr.id,
      form: {
        full_address: addr.full_address,
        address_type: addr.address_type as AddressType,
        is_default: addr.is_default,
      },
    });
  };

  const closeDialog = () =>
    setAddressDialog((prev) => ({ ...prev, open: false }));

  const handleAddressSave = async () => {
    if (!user) return;
    const { form, mode, editId } = addressDialog;
    if (!form.full_address.trim()) {
      toast.error("Address cannot be empty");
      return;
    }
    setAddressSaving(true);
    try {
      // If setting as default, unset others first
      if (form.is_default) {
        await supabase
          .from("mfc_user_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      if (mode === "edit" && editId) {
        const { error } = await supabase
          .from("mfc_user_addresses")
          .update({
            full_address: form.full_address,
            address_type: form.address_type,
            is_default: form.is_default,
          })
          .eq("id", editId);
        if (error) throw error;
        toast.success("Address updated");
      } else {
        // Ensure first address is default
        const isFirst = addresses.length === 0;
        const { error } = await supabase.from("mfc_user_addresses").insert({
          user_id: user.id,
          full_address: form.full_address,
          address_type: form.address_type,
          is_default: isFirst || form.is_default,
        });
        if (error) throw error;
        toast.success("Address added");
      }

      await loadAddresses();
      closeDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save address";
      toast.error(message);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleSetDefault = async (addr: UserAddress) => {
    if (!user || addr.is_default) return;
    try {
      await supabase
        .from("mfc_user_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
      await supabase
        .from("mfc_user_addresses")
        .update({ is_default: true })
        .eq("id", addr.id);
      toast.success("Default address updated");
      await loadAddresses();
    } catch {
      toast.error("Failed to update default address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase.from("mfc_user_addresses").delete().eq("id", id);
      if (error) throw error;
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20 px-6 text-center space-y-6">
        <User className="w-16 h-16 text-muted-foreground/50" />
        <div>
          <h2 className="text-2xl font-bold">Not Logged In</h2>
          <p className="text-muted-foreground mt-2">Login to view your profile and orders.</p>
        </div>
        <Button onClick={() => navigate("/auth/login")} className="w-full h-14 rounded-2xl">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-20 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
        {!isEditing ? (
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-5 h-5 text-primary" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setIsEditing(false); void loadProfile(); }}
              disabled={saving}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="default" size="icon" onClick={handleSave} disabled={saving}>
              <Check className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-6 relative overflow-hidden">
        {isAdmin && (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
            ADMIN
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                type="tel"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{name || "Guest User"}</h2>
              <p className="text-muted-foreground text-sm truncate">{user.email}</p>
              <p className="text-muted-foreground text-xs mt-1 truncate">
                {phone || "No phone linked"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* ── Addresses ───────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Saved Addresses</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary h-8 px-2 text-xs font-semibold"
              onClick={openAddDialog}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add New
            </Button>
          </div>

          {addressLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div
              className="flex items-center gap-4 border-2 border-dashed border-border rounded-2xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={openAddDialog}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">No addresses saved</p>
                <p className="text-xs text-muted-foreground">Tap to add your first address</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all
                    ${addr.is_default
                      ? "bg-primary/5 border-primary/30"
                      : "bg-muted/30 border-border hover:border-border/60"}`}
                >
                  {/* Type icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                      ${addr.is_default ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    {addressTypeIcon[addr.address_type as AddressType] ?? <MapPin className="w-4 h-4" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{addr.address_type}</p>
                      {addr.is_default && (
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{addr.full_address}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.is_default && (
                      <button
                        title="Set as default"
                        onClick={() => void handleSetDefault(addr)}
                        className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                      </button>
                    )}
                    <button
                      title="Edit address"
                      onClick={() => openEditDialog(addr)}
                      className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      title="Delete address"
                      onClick={() => void handleDeleteAddress(addr.id)}
                      className="w-8 h-8 rounded-full hover:bg-red-500/10 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500/70 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Admin button ─────────────────────────────────────────────────── */}
        {isAdmin && (
          <Button
            variant="outline"
            className="w-full h-14 rounded-2xl border-primary text-primary hover:bg-primary/5"
            onClick={() => navigate("/admin")}
          >
            <ShieldAlert className="w-5 h-5 mr-2" />
            Open Admin Command Center
          </Button>
        )}

        {/* ── Recent Orders ─────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-lg">Recent Orders</h3>
            <span
              className="text-sm font-medium text-primary cursor-pointer hover:underline"
              onClick={() => navigate("/orders")}
            >
              View All
            </span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20 flex flex-col items-center">
                <Receipt className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No recent orders</p>
                <Button
                  variant="link"
                  onClick={() => navigate("/shop")}
                  className="mt-2 text-primary"
                >
                  Start ordering
                </Button>
              </div>
            ) : (
              orders.slice(0, 3).map((order) => (
                <div
                  key={`${order.kind}-${order.id}`}
                  className="p-4 bg-card border border-border rounded-2xl shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/orders/${order.id}?kind=${order.kind}`)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">
                      {order.kind === "food" ? "Food Order" : "Delivery"} #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md uppercase">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <span className="font-bold text-primary">₹{order.total || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Logout ──────────────────────────────────────────────────────── */}
        <section className="pt-2">
          <Button
            variant="destructive"
            className="w-full h-14 rounded-2xl text-base font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20"
            onClick={() => void signOut()}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </section>
      </div>

      {/* ── Address Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={addressDialog.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {addressDialog.mode === "add" ? "Add New Address" : "Edit Address"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type selector */}
            <div className="space-y-2">
              <Label>Address Type</Label>
              <div className="flex gap-2">
                {ADDRESS_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setAddressDialog((prev) => ({
                        ...prev,
                        form: { ...prev.form, address_type: type },
                      }))
                    }
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all
                      ${addressDialog.form.address_type === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"}`}
                  >
                    {addressTypeIcon[type]}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Address input */}
            <div className="space-y-1">
              <Label>Full Address</Label>
              <Input
                value={addressDialog.form.full_address}
                onChange={(e) =>
                  setAddressDialog((prev) => ({
                    ...prev,
                    form: { ...prev.form, full_address: e.target.value },
                  }))
                }
                placeholder="e.g. 42, MG Road, Bangalore 560001"
              />
            </div>

            {/* Default toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                role="checkbox"
                aria-checked={addressDialog.form.is_default}
                onClick={() =>
                  setAddressDialog((prev) => ({
                    ...prev,
                    form: { ...prev.form, is_default: !prev.form.is_default },
                  }))
                }
                className={`w-10 h-6 rounded-full transition-colors cursor-pointer
                  ${addressDialog.form.is_default ? "bg-primary" : "bg-muted"}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform
                    ${addressDialog.form.is_default ? "translate-x-4.5" : "translate-x-0.5"}`}
                  style={{ transform: addressDialog.form.is_default ? "translateX(18px)" : "translateX(2px)" }}
                />
              </div>
              <span className="text-sm font-medium">Set as default address</span>
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={addressSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleAddressSave()} disabled={addressSaving}>
              {addressSaving ? "Saving…" : addressDialog.mode === "add" ? "Add Address" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
