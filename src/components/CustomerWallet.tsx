import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Plus, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface CustomerWalletProps {
  userId: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

const CustomerWallet = ({ userId }: CustomerWalletProps) => {
  const [balance, setBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    const [walletRes, txRes] = await Promise.all([
      supabase.from("customer_wallets").select("*").eq("user_id", userId).single(),
      supabase.from("customer_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);

    if (walletRes.data) {
      setBalance(walletRes.data.balance);
    } else {
      // Create wallet if doesn't exist
      await supabase.from("customer_wallets").insert({ user_id: userId, balance: 0 });
      setBalance(0);
    }

    setTransactions(txRes.data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      toast.error("Enter a valid amount between £0.01 and £100");
      return;
    }

    setAdding(true);

    // Add to wallet
    const newBalance = balance + amount;
    await supabase.from("customer_wallets").update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    // Record transaction
    await supabase.from("customer_transactions").insert({
      user_id: userId,
      amount,
      type: "top_up",
      description: `Added £${amount.toFixed(2)} to wallet`,
    });

    setBalance(newBalance);
    setTopUpAmount("");
    setAdding(false);
    toast.success(`£${amount.toFixed(2)} added to your wallet! 💳`);
    fetchData();
  };

  if (loading) return <div className="bg-card rounded-xl border border-border p-6 animate-pulse h-40" />;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Balance header */}
      <div className="bg-gradient-to-r from-primary to-accent p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-primary-foreground" />
          <span className="text-primary-foreground/80 font-body text-sm">Your Balance</span>
        </div>
        <motion.p
          key={balance}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="font-display text-4xl font-bold text-primary-foreground"
        >
          £{balance.toFixed(2)}
        </motion.p>
      </div>

      <div className="p-6 space-y-4">
        {/* Quick top-up buttons */}
        <div>
          <p className="font-body text-sm text-muted-foreground mb-2">Quick top-up</p>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 20, 50].map(amt => (
              <Button
                key={amt}
                variant="outline"
                size="sm"
                className="font-display font-bold"
                onClick={() => { setTopUpAmount(String(amt)); }}
              >
                £{amt}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom top-up */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">£</span>
            <Input
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={topUpAmount}
              onChange={e => setTopUpAmount(e.target.value)}
              placeholder="0.00"
              className="pl-7"
            />
          </div>
          <Button variant="mint" onClick={handleTopUp} disabled={adding || !topUpAmount}>
            <Plus className="w-4 h-4 mr-1" />
            {adding ? "Adding…" : "Add Funds"}
          </Button>
        </div>

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <div>
            <p className="font-body text-sm text-muted-foreground mb-2">Recent activity</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    {tx.type === "top_up" ? (
                      <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center">
                        <ArrowDown className="w-3.5 h-3.5 text-secondary" />
                      </div>
                    ) : tx.type === "reward" ? (
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-xs">🎁</span>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-foreground">{tx.description || tx.type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-display font-bold ${tx.type === "purchase" ? "text-destructive" : "text-secondary"}`}>
                    {tx.type === "purchase" ? "-" : "+"}£{Math.abs(tx.amount).toFixed(2)}
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

export default CustomerWallet;
