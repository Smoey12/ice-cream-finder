import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

interface RouteStop {
  latitude: number;
  longitude: number;
  stop_order: number;
}

/**
 * Simulates demo vendor vans moving along their routes in real-time.
 * Updates the vans array positions smoothly.
 */
export function useVendorMovement(vans: VanLocation[]): VanLocation[] {
  const [animatedVans, setAnimatedVans] = useState<VanLocation[]>(vans);
  const routesRef = useRef<Record<string, RouteStop[]>>({});
  const progressRef = useRef<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch routes for all vendors
  useEffect(() => {
    const vendorIds = vans.map(v => v.vendor_id).filter(Boolean);
    if (vendorIds.length === 0) return;

    const fetchRoutes = async () => {
      const { data } = await supabase
        .from("vendor_route_stops")
        .select("vendor_id, latitude, longitude, stop_order")
        .in("vendor_id", vendorIds)
        .order("stop_order");

      if (data) {
        const grouped: Record<string, RouteStop[]> = {};
        data.forEach(s => {
          if (!grouped[s.vendor_id]) grouped[s.vendor_id] = [];
          grouped[s.vendor_id].push(s);
        });
        routesRef.current = grouped;
      }
    };
    fetchRoutes();
  }, [vans.length]);

  // Update base vans when they change
  useEffect(() => {
    setAnimatedVans(vans);
  }, [vans]);

  // Animate movement along routes
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setAnimatedVans(prev => {
        const routes = routesRef.current;
        if (Object.keys(routes).length === 0) return prev;

        return prev.map(van => {
          const route = routes[van.vendor_id];
          if (!route || route.length < 2) return van;

          // Initialize progress
          if (progressRef.current[van.vendor_id] === undefined) {
            progressRef.current[van.vendor_id] = 0;
          }

          // Advance progress (0 to total segments)
          const totalSegments = route.length - 1;
          let progress = progressRef.current[van.vendor_id];
          progress += 0.02; // Speed of movement
          if (progress >= totalSegments) progress = 0; // Loop back

          progressRef.current[van.vendor_id] = progress;

          // Interpolate between current and next stop
          const segIndex = Math.floor(progress);
          const t = progress - segIndex;
          const from = route[segIndex];
          const to = route[Math.min(segIndex + 1, route.length - 1)];

          return {
            ...van,
            latitude: from.latitude + (to.latitude - from.latitude) * t,
            longitude: from.longitude + (to.longitude - from.longitude) * t,
          };
        });
      });
    }, 2000); // Update every 2 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [vans.length]);

  return animatedVans;
}
