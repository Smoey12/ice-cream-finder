import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, Check, X, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface StopRequest {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  message: string | null;
  status: string;
  created_at: string;
}

const VendorStopRequests = ({ vendorId }: { vendorId: string }) => {
  const [requests, setRequests] = useState<StopRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("customer_stop_requests")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("vendor-stop-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "customer_stop_requests", filter: `vendor_id=eq.${vendorId}` },
        () => fetchRequests()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [vendorId]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("customer_stop_requests")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update request");
    } else {
      toast.success(status === "accepted" ? "Stop request accepted!" : "Request declined");
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const pending = requests.filter(r => r.status === "pending");
  const resolved = requests.filter(r => r.status !== "pending");

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Stop Requests
        </h2>
        {pending.length > 0 && (
          <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {pending.length} new
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-muted-foreground text-sm">No stop requests yet. Customers can request you to stop near them from the live map.</p>
      ) : (
        <div className="space-y-3">
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Pending</p>
              {pending.map(req => (
                <div key={req.id} className="border border-accent rounded-lg p-3 bg-accent/10 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span className="font-medium">Customer</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  {req.message && (
                    <p className="text-sm text-foreground bg-background rounded p-2 italic">"{req.message}"</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="mint" className="flex-1 h-8 text-xs" onClick={() => updateStatus(req.id, "accepted")}>
                      <Check className="w-3.5 h-3.5" /> Accept
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs" onClick={() => updateStatus(req.id, "declined")}>
                      <X className="w-3.5 h-3.5" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Recent</p>
              {resolved.slice(0, 5).map(req => (
                <div key={req.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</div>
                    {req.message && <div className="italic">"{req.message}"</div>}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    req.status === "accepted" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorStopRequests;
