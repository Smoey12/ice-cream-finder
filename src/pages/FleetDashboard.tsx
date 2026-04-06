import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { Truck, MapPin, Radio, CircleOff, Users, TrendingUp, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Demo fleet owner ID
const DEMO_FLEET_OWNER = "4e5d1444-64b4-42d4-bea6-fd474807c619";

const FleetDashboard = () => {
  const [owner, setOwner] = useState<any>(null);
  const [vans, setVans] = useState<any[]>([]);
  const [vanLocations, setVanLocations] = useState<Record<string, any>>({});
  const [wallets, setWallets] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // Get fleet owner profile
    const { data: ownerData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", DEMO_FLEET_OWNER)
      .single();
    setOwner(ownerData);

    // Get child vans
    const { data: childVans } = await supabase
      .from("profiles")
      .select("*")
      .eq("parent_vendor_id", DEMO_FLEET_OWNER);

    // Include the owner van + child vans
    const allVans = [
      ...(ownerData ? [{ ...ownerData, isOwnerVan: true }] : []),
      ...(childVans || []),
    ];
    setVans(allVans);

    // Get locations for all vans
    const vanIds = allVans.map(v => v.id);
    const { data: locs } = await supabase
      .from("vendor_locations")
      .select("*")
      .in("vendor_id", vanIds);

    const locMap: Record<string, any> = {};
    (locs || []).forEach(l => { locMap[l.vendor_id] = l; });
    setVanLocations(locMap);

    // Get wallets
    const { data: walletData } = await supabase
      .from("vendor_wallets")
      .select("*")
      .in("vendor_id", vanIds);

    const walletMap: Record<string, any> = {};
    (walletData || []).forEach(w => { walletMap[w.vendor_id] = w; });
    setWallets(walletMap);

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime location updates
  useEffect(() => {
    const channel = supabase
      .channel("fleet-locations")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "vendor_locations" }, (payload: any) => {
        setVanLocations(prev => ({ ...prev, [payload.new.vendor_id]: payload.new }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-float">🚐</div>
      </div>
    );
  }

  const liveCount = vans.filter(v => vanLocations[v.id]?.is_live).length;
  const totalEarnings = Object.values(wallets).reduce((s: number, w: any) => s + (w?.total_earned || 0), 0);
  const totalBalance = Object.values(wallets).reduce((s: number, w: any) => s + (w?.balance || 0), 0);

  // Fleet pricing
  const vanCount = vans.length;
  const baseMonthly = 7.99;
  const baseYearly = 59.99;
  const discount = vanCount >= 3 ? 0.08 : 0;
  const monthlyTotal = (baseMonthly * vanCount) * (1 - discount);
  const yearlyTotal = (baseYearly * vanCount) * (1 - discount);

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="Logo" width={36} height={36} className="w-9 h-9" />
            <span className="font-display text-lg font-semibold text-foreground hidden sm:inline">
              Fleet Dashboard
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-display">
              <Truck className="w-3 h-3 mr-1" />
              {vanCount} Van{vanCount !== 1 ? "s" : ""}
            </Badge>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-display font-semibold ${
              liveCount > 0 ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
            }`}>
              <span className={`w-2 h-2 rounded-full ${liveCount > 0 ? "bg-secondary animate-pulse" : "bg-muted-foreground"}`} />
              {liveCount} Live
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Fleet overview header */}
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground">
              🚐 {owner?.business_name || "Fleet"}
            </h1>
            <p className="text-muted-foreground font-body mt-1">
              Fleet Management • {vanCount} van{vanCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Users className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="font-display text-2xl font-bold text-foreground">{vanCount}</p>
              <p className="text-[10px] text-muted-foreground font-body">Total Vans</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Radio className="w-5 h-5 text-secondary mx-auto mb-1" />
              <p className="font-display text-2xl font-bold text-secondary">{liveCount}</p>
              <p className="text-[10px] text-muted-foreground font-body">Live Now</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="font-display text-2xl font-bold text-foreground">£{totalEarnings.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground font-body">Total Earned</p>
            </div>
          </div>

          {/* Fleet pricing */}
          <div className="bg-accent/20 border border-accent rounded-xl p-4 text-center">
            <p className="font-display font-semibold text-foreground text-sm">
              Fleet Pricing {discount > 0 && <span className="text-secondary">(8% multi-van discount!)</span>}
            </p>
            <div className="flex justify-center gap-6 mt-2">
              <div>
                <p className="font-display text-lg font-bold text-foreground">£{monthlyTotal.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div>
                <p className="font-display text-lg font-bold text-foreground">£{yearlyTotal.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/yr</span></p>
              </div>
            </div>
          </div>

          {/* Combined wallet */}
          <div className="bg-gradient-to-r from-secondary to-primary rounded-xl p-6 text-center text-primary-foreground">
            <p className="text-xs opacity-70 font-body">Combined Fleet Balance</p>
            <p className="font-display text-4xl font-bold mt-1">£{totalBalance.toFixed(2)}</p>
            <p className="text-xs opacity-60 font-body mt-1">Total earned: £{totalEarnings.toFixed(2)}</p>
          </div>

          {/* Van list */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" /> Your Vans
              </h2>
            </div>
            <div className="divide-y divide-border">
              {vans.map((van, i) => {
                const loc = vanLocations[van.id];
                const wallet = wallets[van.id];
                const isLive = loc?.is_live;

                return (
                  <motion.div
                    key={van.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          isLive ? "bg-secondary/20" : "bg-muted"
                        }`}>
                          {van.van_photo_url ? (
                            <img src={van.van_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : "🚐"}
                        </div>
                        <div>
                          <p className="font-display font-semibold text-foreground text-sm flex items-center gap-1.5">
                            {van.business_name || `Van ${i + 1}`}
                            {van.isOwnerVan && (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Owner</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {isLive ? (
                              <span className="flex items-center gap-1 text-secondary">
                                <Radio className="w-3 h-3" /> Live • {loc.latitude?.toFixed(3)}, {loc.longitude?.toFixed(3)}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <CircleOff className="w-3 h-3" /> Offline
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-sm font-bold text-foreground">
                          £{(wallet?.balance || 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">balance</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/map">
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-1.5" /> View on Map
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="hero" className="w-full">
                <MapPin className="w-4 h-4 mr-1.5" /> Solo Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FleetDashboard;
