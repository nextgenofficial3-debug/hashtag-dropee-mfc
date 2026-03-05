import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Store, Clock, Phone, Users, Key, Copy, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AddAdminDialog from '@/components/admin/AddAdminDialog';
import TimeInput12hr from '@/components/ui/time-input-12hr';
import { useStoreSettings, useUpdateStoreSettings } from '@/hooks/useStoreSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ApiKey {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

const AdminSettings: React.FC = () => {
  const { data: settings, isLoading } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loadingKeys, setLoadingKeys] = useState(true);

  const [formData, setFormData] = useState({
    is_open: true,
    use_scheduled_hours: false,
    opening_time: '09:00',
    closing_time: '21:00',
    open_days: [0, 1, 2, 3, 4, 5, 6],
    upi_id: '',
    whatsapp_primary: '',
    whatsapp_secondary: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        is_open: settings.is_open,
        use_scheduled_hours: settings.use_scheduled_hours,
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        open_days: settings.open_days,
        upi_id: settings.upi_id || '',
        whatsapp_primary: settings.whatsapp_primary || '',
        whatsapp_secondary: settings.whatsapp_secondary || '',
      });
    }
  }, [settings]);

  // Fetch API keys
  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    const { data } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
    setApiKeys((data as ApiKey[]) || []);
    setLoadingKeys(false);
  };

  useEffect(() => { fetchApiKeys(); }, []);

  const generateApiKey = async () => {
    if (!newKeyName.trim()) { toast.error('Enter a name for the API key'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return; }
    const { error } = await supabase.from('api_keys').insert({ name: newKeyName.trim(), created_by: user.id });
    if (error) toast.error('Failed to create API key');
    else { toast.success('API key created!'); setNewKeyName(''); fetchApiKeys(); }
  };

  const revokeApiKey = async (id: string) => {
    await supabase.from('api_keys').update({ is_active: false }).eq('id', id);
    toast.success('Key revoked');
    fetchApiKeys();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied!');
  };

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      open_days: prev.open_days.includes(dayIndex)
        ? prev.open_days.filter(d => d !== dayIndex)
        : [...prev.open_days, dayIndex].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      await updateSettings.mutateAsync({ id: settings.id, ...formData });
    }
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const apiEndpoint = `https://${projectId}.supabase.co/functions/v1/orders-api`;

  if (isLoading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold">Store Settings</h1>
          <p className="text-muted-foreground">Manage your store configuration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Store Status</CardTitle>
                <CardDescription>Control whether your store is open for orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="is_open" className="text-base font-medium">Store is Open</Label>
                    <p className="text-sm text-muted-foreground">Toggle this to open or close your store</p>
                  </div>
                  <Switch id="is_open" checked={formData.is_open} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_open: checked }))} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="use_scheduled" className="text-base font-medium">Use Scheduled Hours</Label>
                    <p className="text-sm text-muted-foreground">Automatically open/close based on schedule</p>
                  </div>
                  <Switch id="use_scheduled" checked={formData.use_scheduled_hours} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_scheduled_hours: checked }))} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Operating Hours */}
          {formData.use_scheduled_hours && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Operating Hours</CardTitle>
                  <CardDescription>Set your store's opening hours</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="mb-2 block">Opening Time</Label>
                      <TimeInput12hr id="opening_time" value={formData.opening_time} onChange={(val) => setFormData(prev => ({ ...prev, opening_time: val }))} />
                    </div>
                    <div>
                      <Label className="mb-2 block">Closing Time</Label>
                      <TimeInput12hr id="closing_time" value={formData.closing_time} onChange={(val) => setFormData(prev => ({ ...prev, closing_time: val }))} />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-3 block">Open Days</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {dayNames.map((day, index) => (
                        <div key={day} className="flex items-center space-x-2 rounded-lg border p-3">
                          <Checkbox id={`day-${index}`} checked={formData.open_days.includes(index)} onCheckedChange={() => handleDayToggle(index)} />
                          <Label htmlFor={`day-${index}`} className="text-sm cursor-pointer">{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Contact & Payment */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Contact & Payment</CardTitle>
                <CardDescription>Configure contact and payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="whatsapp_primary">Primary WhatsApp</Label>
                    <Input id="whatsapp_primary" value={formData.whatsapp_primary} onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_primary: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp_secondary">Secondary WhatsApp</Label>
                    <Input id="whatsapp_secondary" value={formData.whatsapp_secondary} onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_secondary: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="upi_id">UPI ID (for GPay)</Label>
                  <Input id="upi_id" value={formData.upi_id} onChange={(e) => setFormData(prev => ({ ...prev, upi_id: e.target.value }))} placeholder="yourname@upi" />
                  <p className="text-xs text-muted-foreground mt-1">Customers will see this for GPay payments</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Keys for Delivery Agents */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Delivery API Keys</CardTitle>
                <CardDescription>Generate API keys for delivery agent apps to receive live orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">API Endpoint:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all">{apiEndpoint}</code>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => { navigator.clipboard.writeText(apiEndpoint); toast.success('Endpoint copied!'); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-2">Use header: <code>Authorization: Bearer YOUR_API_KEY</code></p>
                </div>

                <div className="flex gap-2">
                  <Input placeholder="Key name (e.g. Dropee App)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                  <Button type="button" onClick={generateApiKey} size="sm"><Plus className="h-4 w-4 mr-1" /> Generate</Button>
                </div>

                {loadingKeys ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : apiKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No API keys yet</p>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map((k) => (
                      <div key={k.id} className="flex items-center gap-2 p-3 rounded-lg border text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{k.name}</p>
                          <code className="text-xs text-muted-foreground break-all">{k.key}</code>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyKey(k.key)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {k.is_active && (
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-destructive" onClick={() => revokeApiKey(k.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!k.is_active && <span className="text-xs text-destructive">Revoked</span>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Admin Management */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Admin Management</CardTitle>
                <CardDescription>Add new administrators to the dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <AddAdminDialog />
                <p className="text-xs text-muted-foreground mt-3">New admins will be able to log in immediately after creation</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending} size="lg">
              <Save className="mr-2 h-4 w-4" />
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </AdminSidebar>
  );
};

export default AdminSettings;
