import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, CheckCircle, XCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface VendorQRScannerProps {
  vendorId: string;
}

const VendorQRScanner = ({ vendorId }: VendorQRScannerProps) => {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showStampAnimation, setShowStampAnimation] = useState(false);

  const processStamp = async (rawValue: string) => {
    // Expected format: icecream-stamp:<user-id>
    const match = rawValue.match(/^icecream-stamp:(.+)$/);
    if (!match) {
      setLastResult({ success: false, message: "Invalid QR code" });
      toast.error("Invalid QR code — not a customer loyalty card");
      return;
    }

    const customerId = match[1];
    setScanning(true);

    try {
      // Fetch or create loyalty record
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

      // Record the transaction
      await supabase.from("customer_transactions").insert({
        user_id: customerId,
        vendor_id: vendorId,
        amount: 0,
        type: "stamp",
        description: "⭐ Loyalty stamp earned",
      });

      const newStamps = (loyalty?.stamps || 0) + 1;
      setLastResult({
        success: true,
        message: `Stamp added! Customer now has ${newStamps} stamp${newStamps !== 1 ? "s" : ""}`,
      });
      setShowStampAnimation(true);
      setTimeout(() => setShowStampAnimation(false), 2000);
      toast.success(`⭐ Stamp added! (${newStamps} total)`);
    } catch (err) {
      setLastResult({ success: false, message: "Error adding stamp" });
      toast.error("Failed to add stamp");
    }

    setScanning(false);
  };

  const handleCameraScan = async () => {
    // Use the native BarcodeDetector API if available, otherwise prompt manual entry
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
              processStamp(barcodes[0].rawValue);
              return;
            }
            requestAnimationFrame(scan);
          } catch {
            stream.getTracks().forEach(t => t.stop());
          }
        };
        scan();

        // Auto-stop after 15 seconds
        setTimeout(() => {
          stream.getTracks().forEach(t => t.stop());
        }, 15000);
      } catch {
        toast.error("Camera access denied. Use manual entry instead.");
      }
    } else {
      toast.info("Camera scanning not supported on this device. Use manual code entry below.");
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    // Allow pasting the full QR value or just the user ID
    const value = manualCode.includes("icecream-stamp:")
      ? manualCode.trim()
      : `icecream-stamp:${manualCode.trim()}`;
    processStamp(value);
    setManualCode("");
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-accent to-primary p-5 text-center">
        <h2 className="font-display text-xl font-bold text-primary-foreground">
          ⭐ Stamp Scanner
        </h2>
        <p className="text-primary-foreground/70 font-body text-xs mt-1">
          Scan customer QR codes to award loyalty stamps
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Camera scan button */}
        <Button
          onClick={handleCameraScan}
          variant="hero"
          size="lg"
          className="w-full"
          disabled={scanning}
        >
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
            <Button variant="mint" onClick={handleManualSubmit} disabled={!manualCode.trim() || scanning}>
              Add Stamp
            </Button>
          </div>
        </div>

        {/* Stamp celebration animation */}
        <AnimatePresence>
          {showStampAnimation && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex flex-col items-center justify-center py-6"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="text-6xl mb-2"
              >
                ⭐
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-lg font-bold text-secondary"
              >
                Stamp Added!
              </motion.p>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    x: (Math.random() - 0.5) * 200,
                    y: -100 - Math.random() * 100,
                  }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="absolute text-2xl"
                >
                  {["⭐", "🍦", "✨", "🌟", "💫", "🎉"][i]}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result feedback */}
        <AnimatePresence>
          {lastResult && !showStampAnimation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                lastResult.success
                  ? "border-secondary bg-secondary/10"
                  : "border-destructive bg-destructive/10"
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
