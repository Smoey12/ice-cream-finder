import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

interface CustomerQRCodeProps {
  userId: string;
  onBalanceChanged?: () => void;
}

const CustomerQRCode = ({ userId, onBalanceChanged }: CustomerQRCodeProps) => {
  const [balance, setBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const cardNumber = userId.replace(/-/g, "").slice(0, 16).toUpperCase();
  const formattedCard = cardNumber.match(/.{1,4}/g)?.join(" ") || cardNumber;

  const fetchBalance = useCallback(async () => {
    const { data } = await supabase
      .from("customer_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();
    if (data) setBalance(data.balance);
    else {
      await supabase.from("customer_wallets").insert({ user_id: userId, balance: 0 });
      setBalance(0);
    }
  }, [userId]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // QR encodes user ID + current balance so vendor scanner can read it
  const qrValue = `icecream-pay:${userId}:${balance.toFixed(2)}`;

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      toast.error("Enter a valid amount between £0.01 and £100");
      return;
    }
    setAdding(true);
    const newBalance = balance + amount;
    await supabase.from("customer_wallets").update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    await supabase.from("customer_transactions").insert({
      user_id: userId,
      amount,
      type: "top_up",
      description: `Added £${amount.toFixed(2)} to QR wallet`,
    });

    setBalance(newBalance);
    setTopUpAmount("");
    setAdding(false);
    toast.success(`£${amount.toFixed(2)} added to your QR code! 💳`);
    onBalanceChanged?.();
  };

  return (
    <motion.div
      initial={{ rotateY: -5, scale: 0.95 }}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="bg-gradient-to-br from-primary via-accent to-secondary p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-70 font-body">LOYALTY & PAYMENT CARD</p>
              <p className="font-display text-lg font-bold mt-0.5">🍦 Yummy Card</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70 font-body">BALANCE</p>
              <motion.p
                key={balance}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="font-display text-xl font-bold"
              >
                £{balance.toFixed(2)}
              </motion.p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white rounded-xl p-3">
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="text-center">
            <p className="font-mono text-sm tracking-[0.15em] opacity-80">
              {formattedCard}
            </p>
            <p className="text-xs opacity-60 font-body mt-1">
              Show to vendor to pay & earn stamps
            </p>
          </div>
        </div>
      </div>

      {/* Top-up section */}
      <div className="bg-card p-4 space-y-3 border-t border-border">
        <p className="font-body text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Wallet className="w-4 h-4 text-primary" /> Add Money to Card
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 20, 50].map(amt => (
            <Button
              key={amt}
              variant="outline"
              size="sm"
              className="font-display font-bold text-xs"
              onClick={() => setTopUpAmount(String(amt))}
            >
              £{amt}
            </Button>
          ))}
        </div>
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
            {adding ? "Adding…" : "Top Up"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerQRCode;
