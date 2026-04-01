import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Smartphone, CreditCard, QrCode } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AppleWalletCardProps {
  userId: string;
}

const AppleWalletCard = ({ userId }: AppleWalletCardProps) => {
  const [adding, setAdding] = useState(false);

  // Generate a short card ID from the user ID for display
  const cardNumber = userId.replace(/-/g, "").slice(0, 16).toUpperCase();
  const formattedCard = cardNumber.match(/.{1,4}/g)?.join(" ") || cardNumber;

  const handleAddToWallet = async () => {
    setAdding(true);
    // In production, this would call an edge function to generate a .pkpass file
    // signed with Apple Developer certificates
    toast.info(
      "Apple Wallet integration requires an Apple Developer Account. Contact support to set this up!",
      { duration: 5000 }
    );
    setAdding(false);
  };

  return (
    <motion.div
      initial={{ rotateY: -5, scale: 0.95 }}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="relative overflow-hidden rounded-2xl"
      style={{ perspective: "1000px" }}
    >
      {/* Card visual */}
      <div className="bg-gradient-to-br from-primary via-accent to-secondary p-6 text-primary-foreground relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />
        
        <div className="relative z-10 space-y-4">
          {/* Card header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-70 font-body">ICE CREAM LOYALTY CARD</p>
              <p className="font-display text-lg font-bold mt-0.5">UK Ice Cream Van Tracker</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          {/* Card number */}
          <div>
            <p className="font-mono text-xl tracking-[0.2em] font-bold">
              {formattedCard}
            </p>
          </div>

          {/* QR placeholder & info */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] opacity-60 font-body">CARD HOLDER</p>
              <p className="text-sm font-display font-semibold">Customer</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center">
              <QrCode className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Add to wallet button */}
      <div className="bg-card border border-border border-t-0 rounded-b-2xl p-4">
        <Button
          onClick={handleAddToWallet}
          disabled={adding}
          className="w-full bg-black hover:bg-black/90 text-white font-semibold gap-2"
          size="lg"
        >
          <Smartphone className="w-5 h-5" />
          {adding ? "Adding…" : "Add to Apple Wallet"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground mt-2 font-body">
          Present this card at any participating ice cream van
        </p>
      </div>
    </motion.div>
  );
};

export default AppleWalletCard;
