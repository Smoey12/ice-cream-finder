import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import RouteMapPreview from "@/components/RouteMapPreview";

interface RouteStop {
  id?: string;
  vendor_id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  stop_order: number;
  arrival_time: string;
}

interface VendorRouteEditorProps {
  userId: string;
}

const VendorRouteEditor = ({ userId }: VendorRouteEditorProps) => {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchStops = async () => {
    const { data } = await supabase
      .from("vendor_route_stops")
      .select("*")
      .eq("vendor_id", userId)
      .order("stop_order", { ascending: true });
    setStops(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStops(); }, [userId]);

  const addStop = () => {
    setStops(prev => [
      ...prev,
      {
        vendor_id: userId,
        stop_name: "",
        latitude: 51.5074,
        longitude: -0.1278,
        stop_order: prev.length + 1,
        arrival_time: "12:00",
      },
    ]);
  };

  const updateStop = (index: number, field: keyof RouteStop, value: string | number) => {
    setStops(prev => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeStop = async (index: number) => {
    const stop = stops[index];
    if (stop.id) {
      await supabase.from("vendor_route_stops").delete().eq("id", stop.id);
    }
    setStops(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stop_order: i + 1 })));
    toast.success("Stop removed");
  };

  const useCurrentLocation = (index: number) => {
    if (!navigator.geolocation) return toast.error("GPS not available");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateStop(index, "latitude", parseFloat(pos.coords.latitude.toFixed(6)));
        updateStop(index, "longitude", parseFloat(pos.coords.longitude.toFixed(6)));
        toast.success("Location set to current GPS");
      },
      () => toast.error("Could not get location")
    );
  };

  const saveAll = async () => {
    setSaving(true);
    // Delete all existing stops and re-insert
    await supabase.from("vendor_route_stops").delete().eq("vendor_id", userId);

    const toInsert = stops
      .filter(s => s.stop_name.trim())
      .map((s, i) => ({
        vendor_id: userId,
        stop_name: s.stop_name,
        latitude: s.latitude,
        longitude: s.longitude,
        stop_order: i + 1,
        arrival_time: s.arrival_time,
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase.from("vendor_route_stops").insert(toInsert);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }

    toast.success("Route saved!");
    await fetchStops();
    setSaving(false);
  };

  if (loading) return <div className="bg-card rounded-xl border border-border p-6 animate-pulse h-32" />;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">🗺️ Daily Route</h2>
          <p className="text-muted-foreground font-body text-sm">
            Set your stops so customers know where to find you
          </p>
        </div>
      </div>

      <AnimatePresence>
        {stops.map((stop, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-border rounded-xl p-4 mb-3 bg-muted/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                {index + 1}
              </div>
              <Input
                value={stop.stop_name}
                onChange={e => updateStop(index, "stop_name", e.target.value)}
                placeholder="Stop name (e.g. Hyde Park)"
                className="flex-1"
              />
              <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => removeStop(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs font-body text-muted-foreground">Lat</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={stop.latitude}
                  onChange={e => updateStop(index, "latitude", parseFloat(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-body text-muted-foreground">Lng</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={stop.longitude}
                  onChange={e => updateStop(index, "longitude", parseFloat(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-body text-muted-foreground">Time</Label>
                <Input
                  type="time"
                  value={stop.arrival_time}
                  onChange={e => updateStop(index, "arrival_time", e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-sky"
              onClick={() => useCurrentLocation(index)}
            >
              <MapPin className="w-3 h-3 mr-1" /> Use current GPS
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Route Map Preview */}
      <div className="mt-4">
        <RouteMapPreview stops={stops} />
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={addStop} className="flex-1">
          <Plus className="w-4 h-4 mr-1" /> Add Stop
        </Button>
        <Button variant="mint" onClick={saveAll} disabled={saving} className="flex-1">
          {saving ? "Saving…" : "Save Route"}
        </Button>
      </div>
    </div>
  );
};

export default VendorRouteEditor;
