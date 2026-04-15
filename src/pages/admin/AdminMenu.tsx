import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function AdminMenu() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("mfc_menu_items")
        .select("*")
        .order("name", { ascending: true });
        
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      toast.error("Failed to load menu items: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const toggleAvailability = async (id: string, currentVal: boolean) => {
    try {
      setItems(items.map(item => item.id === id ? { ...item, is_available: !currentVal } : item));
      const { error } = await supabase
        .from("mfc_menu_items")
        .update({ is_available: !currentVal })
        .eq("id", id);
        
      if (error) {
         setItems(items.map(item => item.id === id ? { ...item, is_available: currentVal } : item));
         throw error;
      }
      toast.success("Item updated");
    } catch (err: any) {
      toast.error("Failed to update item");
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Menu Management</h1>
        <p className="text-zinc-400 mt-1">Quickly toggle availability of your menu items.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Image</th>
                <th className="px-6 py-4 font-semibold">Name & Desc</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold text-right">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 w-20">
                     <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden">
                       {item.image_url ? (
                         <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-zinc-800">No Img</div>
                       )}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="font-bold text-zinc-200">{item.name}</p>
                     <p className="text-xs text-zinc-500 mt-1 line-clamp-1 max-w-[300px]">{item.description}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-400">
                    ₹{item.price}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end pr-2">
                       <Switch 
                         checked={item.is_available} 
                         onCheckedChange={() => toggleAvailability(item.id, item.is_available)} 
                       />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
