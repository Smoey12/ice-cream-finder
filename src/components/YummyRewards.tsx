import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface YummyRewardsProps {
  userId: string;
  onRewardClaimed?: () => void;
}

const YummyRewards = ({ userId, onRewardClaimed }: YummyRewardsProps) => {
  const [stamps, setStamps] = useState(0);
  const [totalStamps, setTotalStamps] = useState(0);
  const [free3Claimed, setFree3Claimed] = useState(0);
  const [free5Claimed, setFree5Claimed] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLoyalty = useCallback(async () => {
    const { data } = await supabase
      .from("customer_loyalty")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setStamps(data.stamps);
      setTotalStamps(data.total_stamps);
      setFree3Claimed(data.free_3_claimed);
      setFree5Claimed(data.free_5_claimed);
    } else {
      await supabase.from("customer_loyalty").insert({
        user_id: userId,
        stamps: 0,
        total_stamps: 0,
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchLoyalty(); }, [fetchLoyalty]);

  const claimReward = async (tier: 3 | 5) => {
    const requiredStamps = tier === 3 ? 2 : 4;
    if (stamps < requiredStamps) {
      toast.error(`You need ${requiredStamps} stamps to claim this reward!`);
      return;
    }

    const newStamps = stamps - requiredStamps;
    const updates: any = {
      stamps: newStamps,
      updated_at: new Date().toISOString(),
    };
    if (tier === 3) updates.free_3_claimed = free3Claimed + 1;
    else updates.free_5_claimed = free5Claimed + 1;

    await supabase.from("customer_loyalty").update(updates).eq("user_id", userId);

    // Add reward to wallet
    const { data: walletData } = await supabase
      .from("customer_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (walletData) {
      await supabase.from("customer_wallets").update({
        balance: walletData.balance + tier,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    }

    // Record transaction
    await supabase.from("customer_transactions").insert({
      user_id: userId,
      amount: tier,
      type: "reward",
      description: `🎁 Yummy Reward: Free £${tier} ice cream!`,
    });

    toast.success(`🎉 £${tier} reward added to your wallet!`);
    fetchLoyalty();
    onRewardClaimed?.();
  };

  if (loading) return <div className="bg-card rounded-xl border border-border p-6 animate-pulse h-40" />;

  // Calculate progress toward each tier
  const tier1Progress = Math.min(stamps, 2);
  const tier2Progress = Math.min(stamps, 4);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent to-primary p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='15' y='40' font-size='30'%3E🍦%3C/text%3E%3C/svg%3E\")",
        }} />
        <h2 className="font-display text-xl font-bold text-primary-foreground relative z-10">
          🍦 Yummy Rewards
        </h2>
        <p className="text-primary-foreground/70 font-body text-xs mt-1 relative z-10">
          Collect stamps with every purchase!
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Current stamps display */}
        <div className="text-center">
          <p className="text-muted-foreground font-body text-sm mb-2">Your stamps</p>
          <div className="flex items-center justify-center gap-1.5">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ scale: i < stamps ? 1 : 0.8, opacity: i < stamps ? 1 : 0.3 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 transition-colors ${
                  i < stamps
                    ? "bg-accent/20 border-accent"
                    : "bg-muted/30 border-border"
                }`}
              >
                {i < stamps ? "⭐" : "○"}
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-body mt-2">
            {stamps} stamp{stamps !== 1 ? "s" : ""} • {totalStamps} total earned
          </p>
        </div>

        {/* Tier 1: 2 stamps = £3 free */}
        <div className={`rounded-xl border-2 p-4 transition-all ${
          stamps >= 2 ? "border-secondary bg-secondary/5" : "border-border"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🍨</span>
                <h3 className="font-display font-bold text-foreground text-sm">2 Stamps Reward</h3>
              </div>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Free £3 ice cream of your choice
              </p>
              <div className="flex gap-1 mt-2">
                {[0, 1].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 ${
                    i < tier1Progress ? "bg-secondary border-secondary" : "border-muted-foreground/30"
                  }`} />
                ))}
              </div>
            </div>
            <Button
              variant="mint"
              size="sm"
              disabled={stamps < 2}
              onClick={() => claimReward(3)}
              className="shrink-0"
            >
              {stamps >= 2 ? "Claim! 🎉" : `${2 - stamps} more`}
            </Button>
          </div>
          {free3Claimed > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Claimed {free3Claimed} time{free3Claimed !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Tier 2: 4 stamps = £5 free */}
        <div className={`rounded-xl border-2 p-4 transition-all ${
          stamps >= 4 ? "border-accent bg-accent/5" : "border-border"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🍦</span>
                <h3 className="font-display font-bold text-foreground text-sm">4 Stamps Reward</h3>
              </div>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Free £5 for any choice of ice cream
              </p>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 ${
                    i < tier2Progress ? "bg-accent border-accent" : "border-muted-foreground/30"
                  }`} />
                ))}
              </div>
            </div>
            <Button
              variant="hero"
              size="sm"
              disabled={stamps < 4}
              onClick={() => claimReward(5)}
              className="shrink-0"
            >
              {stamps >= 4 ? "Claim! 🎉" : `${4 - stamps} more`}
            </Button>
          </div>
          {free5Claimed > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Claimed {free5Claimed} time{free5Claimed !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground font-body">
          Earn 1 stamp per purchase from any van • Rewards added to your wallet
        </p>
      </div>
    </div>
  );
};

export default YummyRewards;
