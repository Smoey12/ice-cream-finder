import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface StopRequestButtonProps {
  vendorId: string;
  vendorName: string;
  userLocation: { lat: number; lng: number } | null;
  userId: string | null;
}

const StopRequestButton = ({ vendorId, vendorName, userLocation, userId }: StopRequestButtonProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequest = async () => {
    if (!userLocation) {
      toast.error("Enable location to request a stop");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("customer_stop_requests").insert({
      user_id: userId || "00000000-0000-0000-0000-000000000099",
      vendor_id: vendorId,
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      message: message.trim() || null,
    });

    if (error) {
      toast.error("Failed to send request");
    } else {
      toast.success(`Stop requested from ${vendorName}!`);
      setSent(true);
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold mt-2 p-2 bg-green-50 rounded-lg">
        <CheckCircle className="w-3.5 h-3.5" />
        Stop requested! The vendor will see your location.
      </div>
    );
  }

  return (
    <div className="mt-2 border-t pt-2 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Request a Stop</p>
      <Input
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Optional message..."
        className="h-7 text-xs"
      />
      <Button
        onClick={handleRequest}
        disabled={sending || !userLocation}
        size="sm"
        className="w-full h-7 text-xs gap-1"
        style={{ background: "linear-gradient(135deg, hsl(340,65%,55%), hsl(160,45%,50%))" }}
      >
        {sending ? "Sending..." : <><MapPin className="w-3 h-3" /> Request Stop Here</>}
      </Button>
    </div>
  );
};

export default StopRequestButton;
