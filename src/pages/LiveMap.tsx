import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVendorMovement } from "@/hooks/useVendorMovement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { LogOut, MapPin, RefreshCw, Search, X, List, Map as MapIcon, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVanId, setSelectedVanId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const DEMO_CUSTOMER_ID = "00000000-0000-0000-0000-000000000099";
  const activeUserId = user?.id || DEMO_CUSTOMER_ID;

  // Watch user location continuously
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 51.5074, lng: -0.1278 });
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 51.5074, lng: -0.1278 }),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
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

  // Fetch favorites
  const fetchFavorites = async () => {
    const { data } = await supabase
      .from("customer_favorites")
      .select("vendor_id")
      .eq("user_id", activeUserId);
    if (data) setFavoriteIds(data.map(f => f.vendor_id));
  };

  useEffect(() => { fetchVans(); fetchFavorites(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("live-vans")
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_locations" }, () => fetchVans())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Simulate vendor movement along routes
  const animatedVans = useVendorMovement(vans);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filteredVans = useMemo(() => {
    let result = [...animatedVans];

    // Filter by favorites if tab active
    if (showFavorites) {
      result = result.filter(v => favoriteIds.includes(v.vendor_id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => v.business_name?.toLowerCase().includes(q));
    }
    if (userLocation) {
      result.sort((a, b) =>
        getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude) -
        getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
      );
    }
    return result;
  }, [animatedVans, searchQuery, userLocation, showFavorites, favoriteIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-float">🍦</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <nav className="bg-card/95 backdrop-blur-xl border-b border-border z-50 shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logoIcon} alt="Logo" width={32} height={32} className="w-8 h-8" />
            <span className="font-display text-base font-semibold text-foreground hidden sm:inline">
              Van Tracker
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative mx-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search vans by name..."
              className="pl-9 pr-8 h-9 rounded-full bg-muted/50 border-border text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant={showFavorites ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => { setShowFavorites(!showFavorites); fetchFavorites(); }}
              title="Favorites"
            >
              <Heart className={`w-4 h-4 ${showFavorites ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setShowList(!showList)}
            >
              {showList ? <MapIcon className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={fetchVans} disabled={fetching}>
              <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
            </Button>
            {user && (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => { signOut(); navigate("/"); }}>
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        <UKMap
          vans={filteredVans}
          userLocation={userLocation}
          selectedVanId={selectedVanId}
          onVanSelect={setSelectedVanId}
          userId={activeUserId}
        />

        {/* Status pill */}
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="bg-card/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-border shadow-lg flex items-center gap-2 text-xs font-body">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            <span className="font-semibold text-foreground">{filteredVans.length}</span>
            <span className="text-muted-foreground">van{filteredVans.length !== 1 ? "s" : ""} {showFavorites ? "favorited" : "live"}</span>
            {searchQuery && <span className="text-muted-foreground">• filtered</span>}
          </div>
        </div>

        {/* Van list panel (slide-over) */}
        <AnimatePresence>
          {showList && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-0 left-0 bottom-0 w-80 z-[1000] bg-card/95 backdrop-blur-xl border-r border-border overflow-y-auto"
            >
              <div className="p-4">
                <h2 className="font-display text-lg font-bold text-foreground mb-3">
                  {showFavorites ? "❤️ Favorite Vans" : "🍦 Nearby Vans"}
                </h2>
                {filteredVans.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">{showFavorites ? "💔" : "😢"}</div>
                    <p className="text-sm text-muted-foreground font-body">
                      {showFavorites ? "No favorite vans yet" : searchQuery ? "No vans match your search" : "No vans live right now"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredVans.map(van => {
                      const dist = userLocation ? getDistance(userLocation.lat, userLocation.lng, van.latitude, van.longitude) : null;
                      const isFav = favoriteIds.includes(van.vendor_id);
                      return (
                        <button
                          key={van.id}
                          onClick={() => { setSelectedVanId(van.id); setShowList(false); }}
                          className={`w-full text-left p-3 rounded-xl border transition-all hover:shadow-md ${
                            selectedVanId === van.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex gap-3">
                            {van.van_photo_url ? (
                              <img src={van.van_photo_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0 text-2xl">🚐</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-display text-sm font-bold text-foreground truncate">{van.business_name}</p>
                                {isFav && <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 shrink-0" />}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                                <span className="text-secondary font-body text-xs font-semibold">Live</span>
                              </div>
                              {dist !== null && (
                                <p className="text-xs text-muted-foreground font-body mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {dist < 1 ? `${(dist * 1760).toFixed(0)} yds` : `${dist.toFixed(1)} mi`}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveMap;
