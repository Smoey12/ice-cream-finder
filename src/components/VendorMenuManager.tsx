import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, IceCream } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItem {
  id: string;
  item_name: string;
  price: number | null;
  description: string | null;
}

interface VendorMenuManagerProps {
  userId: string;
}

const VendorMenuManager = ({ userId }: VendorMenuManagerProps) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("vendor_menu_items")
      .select("*")
      .eq("vendor_id", userId)
      .order("created_at", { ascending: true });
    if (data) setItems(data as MenuItem[]);
  };

  useEffect(() => {
    fetchItems();
  }, [userId]);

  const addItem = async () => {
    if (!newName.trim()) {
      toast.error("Item name is required");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("vendor_menu_items").insert({
      vendor_id: userId,
      item_name: newName.trim(),
      price: newPrice ? parseFloat(newPrice) : null,
      description: newDesc.trim() || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Added "${newName}" to your menu!`);
      setNewName("");
      setNewPrice("");
      setNewDesc("");
      setShowForm(false);
      fetchItems();
    }
    setAdding(false);
  };

  const deleteItem = async (id: string, name: string) => {
    const { error } = await supabase.from("vendor_menu_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Removed "${name}" from menu`);
      fetchItems();
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <IceCream className="w-5 h-5 text-primary" />
          Your Menu
        </h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 mb-4 overflow-hidden"
          >
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <Label className="font-body text-sm">Item Name *</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. 99 Flake"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-body text-sm">Price (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="2.50"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="font-body text-sm">Description</Label>
                  <Input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={addItem} variant="mint" size="sm" disabled={adding}>
                {adding ? "Adding…" : "Add to Menu"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <p className="text-muted-foreground font-body text-sm text-center py-6">
          No menu items yet. Add your ice cream offerings! 🍦
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between bg-muted/30 rounded-lg p-3"
            >
              <div>
                <span className="font-display font-semibold text-foreground">
                  {item.item_name}
                </span>
                {item.price != null && (
                  <span className="ml-2 text-primary font-display font-bold">
                    £{item.price.toFixed(2)}
                  </span>
                )}
                {item.description && (
                  <p className="text-muted-foreground font-body text-xs mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteItem(item.id, item.item_name)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorMenuManager;
