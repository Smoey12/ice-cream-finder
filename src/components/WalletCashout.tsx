import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowDown, ArrowUp, Banknote } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface WalletCashoutProps {
  userId: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

const WalletCashout = ({ userId }: WalletCashoutProps) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashingOut, setCashingOut] = useState(false);
  const [lastCashout, setLastCashout] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [walletRes, txRes, cashoutRes] = await Promise.all([
      supabase.from("customer_wallets").select("*").eq("user_id", userId).single(),
      supabase.from("customer_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("customer_cashouts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ]);

    if (walletRes.data) {
      setBalance(walletRes.data.balance);
    } else {
      await supabase.from("customer_wallets").insert({ user_id: userId, balance: 0 });
      setBalance(0);
    }

    setTransactions(txRes.data || []);
    if (cashoutRes.data && cashoutRes.data.length > 0) {
      setLastCashout(cashoutRes.data[0].created_at);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const canCashOut = () => {
    if (balance <= 0 || balance < 1) return false;
    if (!lastCashout) return true;
    const lastDate = new Date(lastCashout);
    const now = new Date();
    const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 7;
  };

  const daysUntilCashout = () => {
    if (!lastCashout) return 0;
    const lastDate = new Date(lastCashout);
    const now = new Date();
    const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - daysSince));
  };

  const handleCashOut = async () => {
    if (!canCashOut()) return;
    const cashoutAmount = Math.min(balance, 10);

    setCashingOut(true);

    const newBalance = balance - cashoutAmount;
    await supabase.from("customer_wallets").update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    await supabase.from("customer_transactions").insert({
      user_id: userId,
      amount: cashoutAmount,
      type: "cashout",
      description: `💸 Cashed out £${cashoutAmount.toFixed(2)} to bank`,
    });

    await supabase.from("customer_cashouts").insert({
      user_id: userId,
      amount: cashoutAmount,
    });

    toast.success(`💸 £${cashoutAmount.toFixed(2)} sent to your bank!`);
    setCashingOut(false);
    fetchData();
  };

  if (loading) return <div className="bg-card rounded-xl border border-border p-6 animate-pulse h-40" />;

  const cashoutAmount = Math.min(balance, 10);
  const daysLeft = daysUntilCashout();

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Balance header */}
      <div className="bg-gradient-to-r from-primary to-accent p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-primary-foreground" />
          <span className="text-primary-foreground/80 font-body text-sm">Reward Wallet</span>
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
          Earned from Yummy Rewards stamps
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Cash out button */}
        <div className="space-y-2">
          <Button
            variant="mint"
            size="lg"
            className="w-full"
            onClick={handleCashOut}
            disabled={!canCashOut() || cashingOut || balance < 1}
          >
            <Banknote className="w-5 h-5 mr-2" />
            {cashingOut
              ? "Processing…"
              : balance < 1
                ? "Need at least £1 to cash out"
                : daysLeft > 0
                  ? `Cash out available in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
                  : `Cash Out £${cashoutAmount.toFixed(2)} to Bank`}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground font-body">
            Max £10 per cashout • 1 cashout per week
          </p>
        </div>

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <div>
            <p className="font-body text-sm text-muted-foreground mb-2">Recent activity</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    {tx.type === "reward" ? (
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-xs">🎁</span>
                      </div>
                    ) : tx.type === "cashout" ? (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center">
                        <ArrowDown className="w-3.5 h-3.5 text-secondary" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-foreground">{tx.description || tx.type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-display font-bold ${tx.type === "cashout" ? "text-destructive" : "text-secondary"}`}>
                    {tx.type === "cashout" ? "-" : "+"}£{Math.abs(tx.amount).toFixed(2)}
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

export default WalletCashout;
