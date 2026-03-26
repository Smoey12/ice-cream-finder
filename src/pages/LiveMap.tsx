import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { LogOut, MapPin, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import UKMap from "@/components/UKMap";

interface VanLocation {
  id: string;
  vendor_id: string;
  latitude: number;
  longitude: number;
  is_live: boolean;
  last_updated: string;
  business_name?: string;
  van_photo_url?: string | null;
}

const LiveMap = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [vans, setVans] = useState<VanLocation[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fetching, setFetching] = useState(true);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 51.5074, lng: -0.1278 })
      );
    }
  }, []);

  const fetchVans = async () => {
    setFetching(true);
    const { data } = await supabase
      .from("vendor_locations")
      .select("*, profiles:vendor_id(business_name, van_photo_url)")
      .eq("is_live", true);

    if (data) {
      const mapped = data.map((v: any) => ({
        ...v,
        business_name: v.profiles?.business_name || "Ice Cream Van",
        van_photo_url: v.profiles?.van_photo_url || null,
      }));
      setVans(mapped);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchVans();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("live-vans")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_locations" },
        () => fetchVans()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-float">🍦</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <nav className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="Logo" width={36} height={36} className="w-9 h-9" />
            <span className="font-display text-lg font-semibold text-foreground hidden sm:inline">
              Live Van Map
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchVans} disabled={fetching}>
              <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            🍦 Ice Cream Vans Near You
          </h1>
          <p className="text-muted-foreground font-body mb-6">
            {vans.length} van{vans.length !== 1 ? "s" : ""} currently live
            {userLocation && " • Sorted by distance"}
          </p>

          {/* Full UK Map */}
          <UKMap vans={vans} userLocation={userLocation} />

          {vans.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center mt-6">
              <div className="text-6xl mb-4">😢</div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                No Vans Live Right Now
              </h2>
              <p className="text-muted-foreground font-body">
                Check back soon — vans go live throughout the day!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {vans
                .sort((a, b) => {
                  if (!userLocation) return 0;
                  const distA = getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
                  const distB = getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
                  return distA - distB;
                })
                .map((van) => {
                  const dist = userLocation
                    ? getDistance(userLocation.lat, userLocation.lng, van.latitude, van.longitude)
                    : null;
                  return (
                    <motion.div
                      key={van.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Van photo */}
                      {van.van_photo_url ? (
                        <div className="w-full h-40 overflow-hidden">
                          <img
                            src={van.van_photo_url}
                            alt={`${van.business_name} van`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-muted flex items-center justify-center">
                          <span className="text-5xl">🚐</span>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-display text-lg font-bold text-foreground">
                              🚐 {van.business_name}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                              <span className="text-secondary font-body text-sm font-semibold">Live Now</span>
                            </div>
                          </div>
                          {dist !== null && (
                            <span className="bg-sky/10 text-sky font-display text-sm font-semibold px-3 py-1 rounded-full">
                              {dist < 1 ? `${(dist * 1760).toFixed(0)} yds` : `${dist.toFixed(1)} mi`}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground font-body text-sm mb-4">
                          <MapPin className="w-4 h-4" />
                          <span>{van.latitude.toFixed(4)}, {van.longitude.toFixed(4)}</span>
                        </div>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${van.latitude},${van.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="mint" size="sm" className="w-full">
                            Get Directions 🗺️
                          </Button>
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LiveMap;
