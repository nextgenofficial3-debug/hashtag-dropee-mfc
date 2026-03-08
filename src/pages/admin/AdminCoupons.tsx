import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

const AdminCoupons: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '', discount_type: 'percentage' as 'percentage' | 'flat', discount_value: '',
    min_order_amount: '', max_uses: '', is_active: true, valid_from: '', valid_until: '',
  });

  const resetForm = () => {
    setFormData({
      code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '',
      max_uses: '', is_active: true, valid_from: format(new Date(), "yyyy-MM-dd'T'HH:mm"), valid_until: '',
    });
    setSelected(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selected) {
        const { error } = await supabase.from('coupons' as any).update(data).eq('id', selected.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons' as any).insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(selected ? 'Coupon updated' : 'Coupon created');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setDeleteDialogOpen(false);
      toast.success('Coupon deleted');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value) || 0,
      min_order_amount: parseFloat(formData.min_order_amount) || 0,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      is_active: formData.is_active,
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString(),
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
    });
  };

  const openEdit = (c: Coupon) => {
    setSelected(c);
    setFormData({
      code: c.code, discount_type: c.discount_type, discount_value: c.discount_value.toString(),
      min_order_amount: c.min_order_amount.toString(), max_uses: c.max_uses?.toString() || '',
      is_active: c.is_active,
      valid_from: c.valid_from ? format(new Date(c.valid_from), "yyyy-MM-dd'T'HH:mm") : '',
      valid_until: c.valid_until ? format(new Date(c.valid_until), "yyyy-MM-dd'T'HH:mm") : '',
    });
    setIsDialogOpen(true);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Coupon Codes</h1>
            <p className="text-muted-foreground">Create discount codes for customers</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Coupon
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {coupons?.map((coupon, i) => (
              <motion.div key={coupon.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}>
                <Card className={coupon.is_active ? '' : 'opacity-60'}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold text-gold">{coupon.code}</code>
                        <button onClick={() => copyCode(coupon.code, coupon.id)}>
                          {copiedId === coupon.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                      </div>
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold text-primary">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                    </div>
                    {coupon.min_order_amount > 0 && (
                      <p className="text-xs text-muted-foreground">Min. order: ₹{coupon.min_order_amount}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Used: {coupon.used_count}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''} times
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelected(coupon); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {(!coupons || coupons.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎟️</div>
            <h3 className="text-lg font-semibold">No coupons yet</h3>
            <p className="text-muted-foreground">Create your first coupon code</p>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
              <DialogDescription>{selected ? 'Update coupon details' : 'Create a new discount code'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Code *</Label>
                <Input value={formData.code} onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="WELCOME20" required className="uppercase" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(v) => setFormData(p => ({ ...p, discount_type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value *</Label>
                  <Input type="number" min="0" value={formData.discount_value} onChange={(e) => setFormData(p => ({ ...p, discount_value: e.target.value }))} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Min Order Amount</Label>
                  <Input type="number" min="0" value={formData.min_order_amount} onChange={(e) => setFormData(p => ({ ...p, min_order_amount: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <Label>Max Uses (blank = unlimited)</Label>
                  <Input type="number" min="0" value={formData.max_uses} onChange={(e) => setFormData(p => ({ ...p, max_uses: e.target.value }))} placeholder="Unlimited" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Valid From</Label><Input type="datetime-local" value={formData.valid_from} onChange={(e) => setFormData(p => ({ ...p, valid_from: e.target.value }))} /></div>
                <div><Label>Valid Until</Label><Input type="datetime-local" value={formData.valid_until} onChange={(e) => setFormData(p => ({ ...p, valid_until: e.target.value }))} /></div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div><Label>Active</Label><p className="text-sm text-muted-foreground">Available for customers</p></div>
                <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData(p => ({ ...p, is_active: c }))} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>{selected ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
              <AlertDialogDescription>Delete "{selected?.code}"? This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => selected && deleteMutation.mutate(selected.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminSidebar>
  );
};

export default AdminCoupons;
