import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, CheckCircle, XCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface VendorQRScannerProps {
  vendorId: string;
  onPaymentReceived?: () => void;
}

const VendorQRScanner = ({ vendorId, onPaymentReceived }: VendorQRScannerProps) => {
  const [manualCode, setManualCode] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [pendingQR, setPendingQR] = useState<string | null>(null);

  const processQR = async (rawValue: string, amount?: number) => {
    setScanning(true);

    // New format: icecream-pay:<user-id>:<balance>
    const payMatch = rawValue.match(/^icecream-pay:(.+):(.+)$/);
    // Legacy format: icecream-stamp:<user-id>
    const stampMatch = rawValue.match(/^icecream-stamp:(.+)$/);

    const customerId = payMatch ? payMatch[1] : stampMatch ? stampMatch[1] : null;

    if (!customerId) {
      setLastResult({ success: false, message: "Invalid QR code" });
      toast.error("Invalid QR code");
      setScanning(false);
      return;
    }

    try {
      // 1. Always add a loyalty stamp
      const { data: loyalty } = await supabase
        .from("customer_loyalty")
        .select("*")
        .eq("user_id", customerId)
        .single();

      if (loyalty) {
        await supabase.from("customer_loyalty").update({
          stamps: loyalty.stamps + 1,
          total_stamps: loyalty.total_stamps + 1,
          updated_at: new Date().toISOString(),
        }).eq("user_id", customerId);
      } else {
        await supabase.from("customer_loyalty").insert({
          user_id: customerId,
          stamps: 1,
          total_stamps: 1,
        });
      }

      const newStamps = (loyalty?.stamps || 0) + 1;

      // 2. If there's a charge amount, process payment from customer wallet to vendor wallet
      if (amount && amount > 0) {
        // Get customer wallet
        const { data: custWallet } = await supabase
          .from("customer_wallets")
          .select("balance")
          .eq("user_id", customerId)
          .single();

        const custBalance = custWallet?.balance || 0;

        if (custBalance < amount) {
          setLastResult({ success: false, message: `Insufficient funds. Customer has £${custBalance.toFixed(2)}` });
          toast.error(`Customer only has £${custBalance.toFixed(2)}`);
          setScanning(false);
          return;
        }

        // Deduct from customer wallet
        await supabase.from("customer_wallets").update({
          balance: custBalance - amount,
          updated_at: new Date().toISOString(),
        }).eq("user_id", customerId);

        // Record customer transaction
        await supabase.from("customer_transactions").insert({
          user_id: customerId,
          vendor_id: vendorId,
          amount,
          type: "purchase",
          description: `🍦 Paid £${amount.toFixed(2)} at ice cream van`,
        });

        // Add to vendor wallet
        const { data: vendWallet } = await supabase
          .from("vendor_wallets")
          .select("*")
          .eq("vendor_id", vendorId)
          .single();

        if (vendWallet) {
          await supabase.from("vendor_wallets").update({
            balance: vendWallet.balance + amount,
            total_earned: vendWallet.total_earned + amount,
            updated_at: new Date().toISOString(),
          }).eq("vendor_id", vendorId);
        } else {
          await supabase.from("vendor_wallets").insert({
            vendor_id: vendorId,
            balance: amount,
            total_earned: amount,
          });
        }

        // Record vendor payment
        await supabase.from("vendor_payments").insert({
          vendor_id: vendorId,
          amount,
          payment_type: "qr_payment",
          description: `💳 QR payment received — £${amount.toFixed(2)}`,
        });

        setLastResult({
          success: true,
          message: `💳 £${amount.toFixed(2)} received! ⭐ Stamp #${newStamps} added`,
        });
        toast.success(`£${amount.toFixed(2)} received + stamp added!`);
        onPaymentReceived?.();
      } else {
        // Stamp only (no payment)
        await supabase.from("customer_transactions").insert({
          user_id: customerId,
          vendor_id: vendorId,
          amount: 0,
          type: "stamp",
          description: "⭐ Loyalty stamp earned",
        });

        setLastResult({
          success: true,
          message: `⭐ Stamp added! Customer has ${newStamps} stamp${newStamps !== 1 ? "s" : ""}`,
        });
        toast.success(`⭐ Stamp #${newStamps} added!`);
      }

      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 2000);
      setChargeAmount("");
      setPendingQR(null);
    } catch {
      setLastResult({ success: false, message: "Error processing scan" });
      toast.error("Failed to process scan");
    }

    setScanning(false);
  };

  const handleCameraScan = async () => {
    if ("BarcodeDetector" in window) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();

        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });

        const scan = async () => {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              stream.getTracks().forEach(t => t.stop());
              const raw = barcodes[0].rawValue;
              setPendingQR(raw);
              // If charge amount already entered, process immediately
              const amt = parseFloat(chargeAmount);
              if (amt > 0) {
                processQR(raw, amt);
              } else {
                toast.info("QR scanned! Enter charge amount or tap 'Stamp Only'");
              }
              return;
            }
            requestAnimationFrame(scan);
          } catch {
            stream.getTracks().forEach(t => t.stop());
          }
        };
        scan();
        setTimeout(() => stream.getTracks().forEach(t => t.stop()), 15000);
      } catch {
        toast.error("Camera access denied. Use manual entry.");
      }
    } else {
      toast.info("Camera scanning not supported. Use manual code entry below.");
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    const value = manualCode.includes("icecream-")
      ? manualCode.trim()
      : `icecream-pay:${manualCode.trim()}:0`;
    setPendingQR(value);
    const amt = parseFloat(chargeAmount);
    if (amt > 0) {
      processQR(value, amt);
    } else {
      toast.info("Code entered! Set charge amount or tap 'Stamp Only'");
    }
    setManualCode("");
  };

  const handleChargeSubmit = () => {
    if (!pendingQR) {
      toast.error("Scan a QR code first");
      return;
    }
    const amt = parseFloat(chargeAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid charge amount");
      return;
    }
    processQR(pendingQR, amt);
  };

  const handleStampOnly = () => {
    if (!pendingQR) {
      toast.error("Scan a QR code first");
      return;
    }
    processQR(pendingQR);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-accent to-primary p-5 text-center">
        <h2 className="font-display text-xl font-bold text-primary-foreground">
          📱 Scan & Charge
        </h2>
        <p className="text-primary-foreground/70 font-body text-xs mt-1">
          Scan customer QR to collect payment & add stamps
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Camera scan */}
        <Button onClick={handleCameraScan} variant="hero" size="lg" className="w-full" disabled={scanning}>
          <ScanLine className="w-5 h-5 mr-2" />
          {scanning ? "Processing…" : "Scan Customer QR Code"}
        </Button>

        {/* Manual entry */}
        <div>
          <p className="font-body text-sm text-muted-foreground mb-2">Or enter code manually</p>
          <div className="flex gap-2">
            <Input
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Customer card ID"
              onKeyDown={e => e.key === "Enter" && handleManualSubmit()}
            />
            <Button variant="outline" onClick={handleManualSubmit} disabled={!manualCode.trim() || scanning}>
              Enter
            </Button>
          </div>
        </div>

        {/* Pending QR indicator */}
        {pendingQR && (
          <div className="bg-secondary/10 border border-secondary rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-secondary">✅ Customer QR loaded</p>
          </div>
        )}

        {/* Charge amount */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <p className="font-body text-sm font-semibold text-foreground flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary" /> Charge Amount
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[2, 3, 5, 10].map(amt => (
              <Button key={amt} variant="outline" size="sm" className="font-display font-bold text-xs"
                onClick={() => setChargeAmount(String(amt))}>
                £{amt}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">£</span>
              <Input
                type="number" min="0.01" step="0.01"
                value={chargeAmount}
                onChange={e => setChargeAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
            <Button variant="mint" onClick={handleChargeSubmit} disabled={!pendingQR || !chargeAmount || scanning}>
              Charge
            </Button>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleStampOnly} disabled={!pendingQR || scanning}>
            ⭐ Stamp Only (no charge)
          </Button>
        </div>

        {/* Animation */}
        <AnimatePresence>
          {showAnimation && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex flex-col items-center justify-center py-6 relative"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="text-6xl mb-2"
              >
                💳
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-lg font-bold text-secondary"
              >
                Payment Processed!
              </motion.p>
              {[...Array(6)].map((_, i) => (
                <motion.div key={i}
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{ opacity: 0, x: (Math.random() - 0.5) * 200, y: -100 - Math.random() * 100 }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="absolute text-2xl"
                >
                  {["💳", "⭐", "🍦", "✨", "💰", "🎉"][i]}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {lastResult && !showAnimation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                lastResult.success ? "border-secondary bg-secondary/10" : "border-destructive bg-destructive/10"
              }`}
            >
              {lastResult.success ? (
                <CheckCircle className="w-6 h-6 text-secondary shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-destructive shrink-0" />
              )}
              <p className="font-body text-sm text-foreground">{lastResult.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VendorQRScanner;
