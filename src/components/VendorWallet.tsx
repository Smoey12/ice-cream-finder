import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Banknote, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface VendorWalletProps {
  vendorId: string;
}

const VendorWallet = ({ vendorId }: VendorWalletProps) => {
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [cashingOut, setCashingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const [walletRes, paymentsRes] = await Promise.all([
      supabase.from("vendor_wallets").select("*").eq("vendor_id", vendorId).single(),
      supabase.from("vendor_payments").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }).limit(10),
    ]);

    if (walletRes.data) {
      setBalance(walletRes.data.balance);
      setTotalEarned(walletRes.data.total_earned);
    } else {
      await supabase.from("vendor_wallets").insert({ vendor_id: vendorId, balance: 0, total_earned: 0 });
    }

    setRecentPayments(paymentsRes.data || []);
    setLoading(false);
  }, [vendorId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCashOut = async () => {
    const amount = parseFloat(cashoutAmount) || balance;
    if (amount <= 0 || amount > balance) {
      toast.error("Invalid amount");
      return;
    }

    setCashingOut(true);

    await supabase.from("vendor_wallets").update({
      balance: balance - amount,
      total_withdrawn: (await supabase.from("vendor_wallets").select("total_withdrawn").eq("vendor_id", vendorId).single()).data?.total_withdrawn + amount || amount,
      updated_at: new Date().toISOString(),
    }).eq("vendor_id", vendorId);

    await supabase.from("vendor_cashouts").insert({
      vendor_id: vendorId,
      amount,
    });

    await supabase.from("vendor_payments").insert({
      vendor_id: vendorId,
      amount,
      payment_type: "cashout",
      description: `💸 Cashed out £${amount.toFixed(2)} to bank`,
    });

    toast.success(`💸 £${amount.toFixed(2)} sent to your bank account!`);
    setCashoutAmount("");
    setCashingOut(false);
    fetchData();
  };

  if (loading) return <div className="bg-card rounded-xl border border-border p-6 animate-pulse h-40" />;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-secondary to-primary p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-primary-foreground" />
          <span className="text-primary-foreground/80 font-body text-sm">Vendor Wallet</span>
        </div>
        <motion.p
          key={balance}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="font-display text-4xl font-bold text-primary-foreground"
        >
          £{balance.toFixed(2)}
        </motion.p>
        <p className="text-primary-foreground/60 text-xs font-body mt-1">
          Total earned: £{totalEarned.toFixed(2)}
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Cash out */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">£</span>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={cashoutAmount}
                onChange={e => setCashoutAmount(e.target.value)}
                placeholder={balance.toFixed(2)}
                className="pl-7"
              />
            </div>
            <Button variant="mint" onClick={handleCashOut} disabled={cashingOut || balance <= 0}>
              <Banknote className="w-4 h-4 mr-1" />
              {cashingOut ? "Processing…" : "Cash Out"}
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground font-body">
            Unlimited cashouts • No fees • Instant to your bank
          </p>
        </div>

        {/* Recent activity */}
        {recentPayments.length > 0 && (
          <div>
            <p className="font-body text-sm text-muted-foreground mb-2">Recent activity</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {recentPayments.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      tx.payment_type === "cashout" ? "bg-primary/20" : "bg-secondary/20"
                    }`}>
                      {tx.payment_type === "cashout" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{tx.description || tx.payment_type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-display font-bold ${
                    tx.payment_type === "cashout" ? "text-destructive" : "text-secondary"
                  }`}>
                    {tx.payment_type === "cashout" ? "-" : "+"}£{Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorWallet;
