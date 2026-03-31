import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  business_name: string | null;
}

interface MenuItem {
  id: string;
  item_name: string;
  price: number | null;
  vendor_id: string;
}

interface CustomerPaymentProps {
  userId: string;
  onPurchaseComplete?: () => void;
}

const CustomerPayment = ({ userId, onPurchaseComplete }: CustomerPaymentProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [balance, setBalance] = useState(0);
  const [paying, setPaying] = useState(false);

  const fetchBalance = useCallback(async () => {
    const { data } = await supabase.from("customer_wallets").select("balance").eq("user_id", userId).single();
    if (data) setBalance(data.balance);
  }, [userId]);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase.from("vendor_locations").select("vendor_id, profiles:vendor_id(id, business_name)").eq("is_live", true);
      if (data) {
        const v = data.map((d: any) => ({
          id: d.profiles?.id || d.vendor_id,
          business_name: d.profiles?.business_name || "Ice Cream Van",
        }));
        setVendors(v);
      }
    };
    fetchVendors();
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (!selectedVendor) { setMenuItems([]); return; }
    const fetchMenu = async () => {
      const { data } = await supabase
        .from("vendor_menu_items")
        .select("id, item_name, price, vendor_id")
        .eq("vendor_id", selectedVendor);
      setMenuItems(data || []);
      setSelectedItem("");
    };
    fetchMenu();
  }, [selectedVendor]);

  const selectedMenuItem = menuItems.find(m => m.id === selectedItem);
  const itemPrice = selectedMenuItem?.price || 0;

  const handlePay = async () => {
    if (!selectedVendor || !selectedItem || !selectedMenuItem) {
      toast.error("Select a van and an item first");
      return;
    }

    if (balance < itemPrice) {
      toast.error("Insufficient wallet balance. Please top up!");
      return;
    }

    setPaying(true);

    // Deduct from wallet
    const newBalance = balance - itemPrice;
    await supabase.from("customer_wallets").update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    // Record customer transaction
    await supabase.from("customer_transactions").insert({
      user_id: userId,
      vendor_id: selectedVendor,
      amount: itemPrice,
      type: "purchase",
      description: `🍦 ${selectedMenuItem.item_name} from ${vendors.find(v => v.id === selectedVendor)?.business_name || "vendor"}`,
    });

    // Record vendor payment (income)
    await supabase.from("vendor_payments").insert({
      vendor_id: selectedVendor,
      amount: itemPrice,
      payment_type: "digital_sale",
      description: `Digital payment: ${selectedMenuItem.item_name}`,
      status: "completed",
    });

    // Add to site wallet
    const { data: siteWallet } = await supabase.from("wallet").select("*").limit(1).single();
    if (siteWallet) {
      await supabase.from("wallet").update({
        balance: siteWallet.balance + itemPrice,
        total_earned: siteWallet.total_earned + itemPrice,
        updated_at: new Date().toISOString(),
      }).eq("id", siteWallet.id);

      await supabase.from("wallet_transactions").insert({
        amount: itemPrice,
        type: "vendor_sale",
        description: `Sale: ${selectedMenuItem.item_name}`,
      });
    }

    // Add loyalty stamp
    const { data: loyalty } = await supabase
      .from("customer_loyalty")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (loyalty) {
      await supabase.from("customer_loyalty").update({
        stamps: loyalty.stamps + 1,
        total_stamps: loyalty.total_stamps + 1,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    } else {
      await supabase.from("customer_loyalty").insert({
        user_id: userId,
        stamps: 1,
        total_stamps: 1,
      });
    }

    setBalance(newBalance);
    setSelectedItem("");
    setPaying(false);
    toast.success(`Paid £${itemPrice.toFixed(2)} for ${selectedMenuItem.item_name}! ⭐ +1 stamp`);
    onPurchaseComplete?.();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-bold text-foreground">Pay with Digital Card</h2>
      </div>

      <div className="space-y-3">
        {/* Select vendor */}
        <div>
          <p className="text-xs text-muted-foreground font-body mb-1">Choose a van</p>
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger>
              <SelectValue placeholder="Select an ice cream van..." />
            </SelectTrigger>
            <SelectContent>
              {vendors.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  🚐 {v.business_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Select menu item */}
        {menuItems.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-body mb-1">Choose your treat</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selectedItem === item.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-display text-sm font-semibold text-foreground">{item.item_name}</span>
                    {item.price != null && (
                      <span className="font-display font-bold text-secondary">£{item.price.toFixed(2)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pay button */}
        {selectedItem && (
          <div className="pt-2 space-y-2">
            <div className="flex justify-between items-center text-sm font-body px-1">
              <span className="text-muted-foreground">Wallet balance:</span>
              <span className={`font-bold ${balance >= itemPrice ? "text-secondary" : "text-destructive"}`}>
                £{balance.toFixed(2)}
              </span>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handlePay}
              disabled={paying || balance < itemPrice}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              {paying ? "Processing…" : balance < itemPrice
                ? "Insufficient funds"
                : `Pay £${itemPrice.toFixed(2)} 💳`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPayment;
