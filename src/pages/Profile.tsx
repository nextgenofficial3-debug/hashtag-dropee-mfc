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

// ── Types ──────────────────────────────────────────────────────────────────────
const ADDRESS_TYPES = ["Home", "Work", "Other"] as const;
type AddressType = (typeof ADDRESS_TYPES)[number];

interface SavedAddress {
  id: string;
  address_type: AddressType;
  full_address: string;
  is_default: boolean;
}

interface AddressFormState {
  full_address: string;
  address_type: AddressType;
  is_default: boolean;
}

const addressTypeIcon: Record<AddressType, React.ReactNode> = {
  Home: <Home className="w-4 h-4" />,
  Work: <Briefcase className="w-4 h-4" />,
  Other: <MapPin className="w-4 h-4" />,
};

const defaultAddressForm: AddressFormState = {
  full_address: "",
  address_type: "Home",
  is_default: false,
};

// ── LocalStorage helpers (no DB dependency) ───────────────────────────────────
const PROFILE_KEY = (uid: string) => `mfc_profile_${uid}`;
const ADDRESSES_KEY = (uid: string) => `mfc_addresses_${uid}`;

function loadLocalProfile(uid: string) {
  try {
    const raw = localStorage.getItem(PROFILE_KEY(uid));
    if (raw) return JSON.parse(raw) as { name: string; phone: string };
  } catch { /* ignore */ }
  return { name: "", phone: "" };
}

function saveLocalProfile(uid: string, name: string, phone: string) {
  try { localStorage.setItem(PROFILE_KEY(uid), JSON.stringify({ name, phone })); } catch { /* ignore */ }
}

function loadLocalAddresses(uid: string): SavedAddress[] {
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY(uid));
    if (raw) return JSON.parse(raw) as SavedAddress[];
  } catch { /* ignore */ }
  return [];
}

function saveLocalAddresses(uid: string, addresses: SavedAddress[]) {
  try { localStorage.setItem(ADDRESSES_KEY(uid), JSON.stringify(addresses)); } catch { /* ignore */ }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, signOut, isAdmin, refreshRole } = useAuth();
  const navigate = useNavigate();
  const { orders } = useCustomerOrders(user?.id);

  // Profile
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressDialog, setAddressDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    editId?: string;
    form: AddressFormState;
  }>({ open: false, mode: "add", form: defaultAddressForm });

  // ── Load from localStorage ─────────────────────────────────────────────────
  const loadProfile = useCallback(() => {
    if (!user) return;
    const local = loadLocalProfile(user.id);
    setName(local.name || user.user_metadata?.full_name || "");
    setPhone(local.phone || user.user_metadata?.phone || "");
  }, [user]);

  const loadAddresses = useCallback(() => {
    if (!user) return;
    setAddresses(loadLocalAddresses(user.id));
  }, [user]);

  useEffect(() => {
    loadProfile();
    loadAddresses();
    void refreshRole?.();
  }, [loadProfile, loadAddresses, refreshRole]);

  // ── Profile save — instant localStorage + background Supabase sync ─────────
  const handleSave = () => {
    if (!user) return;
    saveLocalProfile(user.id, name, phone);
    toast.success("Profile saved!");
    setIsEditing(false);
    // Background sync (fire & forget — doesn't block UI)
    void supabase.auth.updateUser({ data: { full_name: name, phone } }).catch((e) =>
      console.warn("[Profile] background sync failed:", e)
    );
  };

  const handleCancel = () => { setIsEditing(false); loadProfile(); };

  // ── Address helpers — pure localStorage ───────────────────────────────────
  const persist = (updated: SavedAddress[]) => {
    if (!user) return;
    setAddresses(updated);
    saveLocalAddresses(user.id, updated);
  };

  const openAddDialog = () =>
    setAddressDialog({ open: true, mode: "add", form: { ...defaultAddressForm } });

  const openEditDialog = (addr: SavedAddress) =>
    setAddressDialog({
      open: true, mode: "edit", editId: addr.id,
      form: { full_address: addr.full_address, address_type: addr.address_type, is_default: addr.is_default },
    });

  const closeDialog = () => setAddressDialog((p) => ({ ...p, open: false }));

  const handleAddressSave = () => {
    const { form, mode, editId } = addressDialog;
    if (!form.full_address.trim()) { toast.error("Address cannot be empty"); return; }

    let updated: SavedAddress[];

    if (mode === "add") {
      const isFirst = addresses.length === 0;
      const newAddr: SavedAddress = {
        id: crypto.randomUUID(),
        address_type: form.address_type,
        full_address: form.full_address,
        is_default: isFirst || form.is_default,
      };
      updated = form.is_default || isFirst
        ? [...addresses.map((a) => ({ ...a, is_default: false })), newAddr]
        : [...addresses, newAddr];
      toast.success("Address added");
    } else {
      updated = addresses.map((a) =>
        a.id === editId
          ? { ...a, full_address: form.full_address, address_type: form.address_type, is_default: form.is_default }
          : form.is_default ? { ...a, is_default: false } : a
      );
      toast.success("Address updated");
    }

    persist(updated);
    closeDialog();
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({ ...a, is_default: a.id === id }));
    persist(updated);
    toast.success("Default address updated");
  };

  const handleDelete = (id: string) => {
    persist(addresses.filter((a) => a.id !== id));
    toast.success("Address deleted");
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
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="default" size="icon" onClick={handleSave}>
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
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" type="tel" />
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
              <p className="text-muted-foreground text-xs mt-1 truncate">{phone || "No phone linked"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* ── Addresses ───────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Saved Addresses</h3>
            <Button variant="ghost" size="sm" className="text-primary h-8 px-2 text-xs font-semibold" onClick={openAddDialog}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          </div>

          {addresses.length === 0 ? (
            <button
              onClick={openAddDialog}
              className="w-full flex items-center gap-3 border-2 border-dashed border-border rounded-2xl p-4 hover:border-primary/40 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">No addresses saved</p>
                <p className="text-xs text-muted-foreground/70">Tap to add your first delivery address</p>
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
                    ${addr.is_default ? "bg-primary/5 border-primary/25" : "bg-muted/20 border-border"}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                    ${addr.is_default ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {addressTypeIcon[addr.address_type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{addr.address_type}</span>
                      {addr.is_default && (
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full leading-none">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{addr.full_address}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {!addr.is_default && (
                      <button
                        title="Set as default"
                        onClick={() => handleSetDefault(addr.id)}
                        className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      title="Edit"
                      onClick={() => openEditDialog(addr)}
                      className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => handleDelete(addr.id)}
                      className="w-8 h-8 rounded-full hover:bg-red-500/10 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
            <span className="text-sm font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate("/orders")}>
              View All
            </span>
          </div>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20 flex flex-col items-center">
                <Receipt className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No recent orders</p>
                <Button variant="link" onClick={() => navigate("/shop")} className="mt-2 text-primary">
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
                    <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md uppercase">{order.status}</span>
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
            <DialogTitle>{addressDialog.mode === "add" ? "Add New Address" : "Edit Address"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Address Type</Label>
              <div className="flex gap-2">
                {ADDRESS_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setAddressDialog((p) => ({ ...p, form: { ...p.form, address_type: type } }))}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all
                      ${addressDialog.form.address_type === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground"}`}
                  >
                    {addressTypeIcon[type]}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Full Address</Label>
              <Input
                value={addressDialog.form.full_address}
                onChange={(e) => setAddressDialog((p) => ({ ...p, form: { ...p.form, full_address: e.target.value } }))}
                placeholder="e.g. 42, MG Road, Bangalore 560001"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                role="checkbox"
                aria-checked={addressDialog.form.is_default}
                onClick={() => setAddressDialog((p) => ({ ...p, form: { ...p.form, is_default: !p.form.is_default } }))}
                className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative shrink-0
                  ${addressDialog.form.is_default ? "bg-primary" : "bg-muted"}`}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
                  style={{ transform: addressDialog.form.is_default ? "translateX(18px)" : "translateX(2px)" }}
                />
              </div>
              <span className="text-sm font-medium">Set as default address</span>
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleAddressSave}>
              {addressDialog.mode === "add" ? "Add Address" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
