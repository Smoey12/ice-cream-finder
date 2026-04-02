import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import { LogOut, MapPin, Radio, CircleOff, Navigation } from "lucide-react";
import VanPhotoUpload from "@/components/VanPhotoUpload";
import BillingToggle from "@/components/BillingToggle";
import VendorMenuManager from "@/components/VendorMenuManager";
import VendorRouteEditor from "@/components/VendorRouteEditor";
import VendorQRScanner from "@/components/VendorQRScanner";
import { motion } from "framer-motion";
import { toast } from "sonner";

const VendorDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Dev bypass: skip auth redirect
    // if (!loading && !user) {
    //   navigate("/auth/vendor");
    // }
  }, [user, loading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (prof) {
      setProfile(prof);
      setBusinessName(prof.business_name || "");

      // Redirect customers to map
      if (prof.role === "customer") {
        navigate("/map");
        return;
      }
    }

    const { data: loc } = await supabase
      .from("vendor_locations")
      .select("*")
      .eq("vendor_id", user.id)
      .single();

    if (loc) {
      setLocation(loc);
      setIsLive(loc.is_live);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleLive = async () => {
    if (!location || !user) return;
    const newLive = !isLive;

    if (newLive && navigator.geolocation) {
      // Start tracking
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          await supabase
            .from("vendor_locations")
            .update({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              is_live: true,
              last_updated: new Date().toISOString(),
            })
            .eq("vendor_id", user.id);
        },
        (err) => toast.error("GPS error: " + err.message),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      setWatchId(id);

      // Initial update
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await supabase
          .from("vendor_locations")
          .update({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            is_live: true,
            last_updated: new Date().toISOString(),
          })
          .eq("vendor_id", user.id);
      });

      setIsLive(true);
      toast.success("You're now live! Customers can see your location.");
    } else {
      // Stop tracking
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      await supabase
        .from("vendor_locations")
        .update({ is_live: false, last_updated: new Date().toISOString() })
        .eq("vendor_id", user.id);
      setIsLive(false);
      toast.info("You're now offline.");
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ business_name: businessName, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
    setSaving(false);
  };

  // Cleanup GPS watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-float">🚐</div>
      </div>
    );
  }

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="Logo" width={36} height={36} className="w-9 h-9" />
            <span className="font-display text-lg font-semibold text-foreground hidden sm:inline">
              Vendor Dashboard
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-display font-semibold ${
              isLive ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
            }`}>
              <span className={`w-2 h-2 rounded-full ${isLive ? "bg-secondary animate-pulse" : "bg-muted-foreground"}`} />
              {isLive ? "Live" : "Offline"}
            </div>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Trial banner */}
          {trialDaysLeft > 0 && (
            <div className="bg-accent/20 border border-accent rounded-xl p-4 text-center">
              <p className="font-display font-semibold text-foreground">
                🎉 Free Trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining
              </p>
              <p className="font-body text-sm text-muted-foreground">
                {profile?.billing_cycle === "yearly" ? "£59.99/year" : "£7.99/month"} after trial ends
              </p>
            </div>
          )}

          {/* Go Live */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Live Tracking
            </h2>
            <p className="text-muted-foreground font-body text-sm mb-6">
              Toggle your live status to let customers find you. Your GPS location will be shared in real-time.
            </p>

            <Button
              onClick={toggleLive}
              variant={isLive ? "destructive" : "mint"}
              size="lg"
              className="w-full"
            >
              {isLive ? (
                <>
                  <CircleOff className="w-5 h-5" /> Go Offline
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5" /> Go Live 🚐
                </>
              )}
            </Button>

            {isLive && location && (
              <div className="mt-4 flex items-center gap-2 text-secondary font-body text-sm">
                <Navigation className="w-4 h-4" />
                Broadcasting at {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
              </div>
            )}
          </div>

          {/* Van Photo Upload */}
          {user && (
            <VanPhotoUpload
              userId={user.id}
              currentPhotoUrl={profile?.van_photo_url || null}
              onPhotoUpdated={() => fetchData()}
            />
          )}

          {/* Menu Manager */}
          {user && <VendorMenuManager userId={user.id} />}

          {/* Route Editor */}
          {user && <VendorRouteEditor userId={user.id} />}

          {/* Billing Plan Toggle */}
          {user && (
            <BillingToggle
              userId={user.id}
              currentCycle={profile?.billing_cycle || null}
              onUpdated={() => fetchData()}
            />
          )}

          {/* Profile */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">
              Business Profile
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="font-body">Business Name</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1.5"
                  placeholder="Your business name"
                />
              </div>
              <div>
                <Label className="font-body">Email</Label>
                <Input value={user?.email || ""} disabled className="mt-1.5 opacity-60" />
              </div>
              <div>
                <Label className="font-body">Plan</Label>
                <Input
                  value={profile?.billing_cycle === "yearly" ? "Annual — £59.99/yr" : "Monthly — £7.99/mo"}
                  disabled
                  className="mt-1.5 opacity-60"
                />
              </div>
              <Button onClick={updateProfile} variant="hero" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorDashboard;
