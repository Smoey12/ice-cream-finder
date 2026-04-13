import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline, CircleMarker, Tooltip, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import FavoriteButton from "@/components/FavoriteButton";
import StopRequestButton from "@/components/StopRequestButton";

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const vanIcon = new L.DivIcon({
  html: `<div style="
    width:40px;height:40px;border-radius:50%;
    background:linear-gradient(135deg,hsl(340,65%,55%),hsl(160,45%,50%));
    display:flex;align-items:center;justify-content:center;
    font-size:20px;box-shadow:0 3px 12px rgba(0,0,0,0.3);
    border:3px solid white;
  ">🚐</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: "",
});

const userIcon = new L.DivIcon({
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:hsl(200,75%,60%);
    border:3px solid white;
    box-shadow:0 0 0 3px hsla(200,75%,60%,0.3), 0 2px 8px rgba(0,0,0,0.2);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: "",
});

interface MenuItem {
  id: string;
  item_name: string;
  price: number | null;
  description: string | null;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface RouteStop {
  id: string;
  vendor_id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  stop_order: number;
  arrival_time: string | null;
}

interface Van {
  id: string;
  vendor_id?: string;
  latitude: number;
  longitude: number;
  business_name?: string;
  van_photo_url?: string | null;
}

interface UKMapProps {
  vans: Van[];
  userLocation?: { lat: number; lng: number } | null;
  selectedVanId?: string | null;
  onVanSelect?: (vanId: string | null) => void;
  userId?: string | null;
}

const UK_CENTER: [number, number] = [54.5, -2.5];
const UK_BOUNDS: [[number, number], [number, number]] = [
  [49.5, -8.5],
  [60.5, 2.5],
];

// Route colors per vendor (cycle through)
const ROUTE_COLORS = [
  "hsl(340, 65%, 55%)", // strawberry
  "hsl(160, 45%, 50%)", // mint
  "hsl(200, 75%, 60%)", // sky
  "hsl(45, 90%, 55%)",  // vanilla
  "hsl(25, 60%, 45%)",  // chocolate
];

const FitBounds = ({ vans, userLocation }: { vans: Van[]; userLocation?: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (vans.length > 0) {
      const bounds = L.latLngBounds(vans.map(v => [v.latitude, v.longitude]));
      if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    } else {
      map.fitBounds(UK_BOUNDS, { padding: [20, 20] });
    }
  }, [map, vans.length]);
  return null;
};

const FlyToVan = ({ vanId, vans, frozenPositions }: { vanId: string | null; vans: Van[]; frozenPositions: Record<string, [number, number]> }) => {
  const map = useMap();
  useEffect(() => {
    if (vanId) {
      // Don't fly if popup is open for this van (position is frozen)
      if (frozenPositions[vanId]) return;
      const van = vans.find(v => v.id === vanId);
      if (van) map.flyTo([van.latitude, van.longitude], 14, { duration: 1 });
    }
  }, [vanId, map, vans, frozenPositions]);
  return null;
};

const VanPopup = ({ van, userId, userLocation }: { van: Van; userId?: string | null; userLocation?: { lat: number; lng: number } | null }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!van.vendor_id) { setLoadingMenu(false); return; }
      const [menuRes, routeRes, reviewRes] = await Promise.all([
        supabase.from("vendor_menu_items").select("id, item_name, price, description").eq("vendor_id", van.vendor_id),
        supabase.from("vendor_route_stops").select("*").eq("vendor_id", van.vendor_id).order("stop_order"),
        supabase.from("vendor_reviews").select("*").eq("vendor_id", van.vendor_id).order("created_at", { ascending: false }).limit(5),
      ]);
      setMenu(menuRes.data || []);
      setRouteStops(routeRes.data || []);
      setReviews(reviewRes.data || []);
      setLoadingMenu(false);
    };
    fetchData();
  }, [van.vendor_id]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : 0;

  const stars = (rating: number) => "⭐".repeat(Math.round(rating));

  return (
    <div className="min-w-[220px] max-w-[280px]">
      {van.van_photo_url && (
        <img src={van.van_photo_url} alt={van.business_name} className="w-full h-28 object-cover rounded-lg mb-2" />
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm mb-0.5">🍦 {van.business_name || "Ice Cream Van"}</h3>
        {van.vendor_id && <FavoriteButton vendorId={van.vendor_id} userId={userId || null} />}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live Now
        </span>
        {reviews.length > 0 && (
          <span className="text-xs text-gray-500 font-semibold">
            {stars(avgRating)} <span className="text-gray-400">({reviews.length})</span>
          </span>
        )}
      </div>

      {loadingMenu ? (
        <p className="text-xs text-gray-400">Loading...</p>
      ) : (
        <>
          {menu.length > 0 && (
            <div className="border-t pt-2 mt-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Menu</p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {menu.map(item => (
                  <div key={item.id} className="flex justify-between items-start text-xs">
                    <span className="text-gray-700 font-medium">{item.item_name}</span>
                    {item.price != null && (
                      <span className="text-gray-500 font-semibold ml-2 whitespace-nowrap">£{item.price.toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {routeStops.length > 0 && (
            <div className="border-t pt-2 mt-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Today's Route</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {routeStops.map(stop => (
                  <div key={stop.id} className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-400 font-mono w-10 shrink-0">{stop.arrival_time || "—"}</span>
                    <span className="text-gray-700">{stop.stop_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {menu.length > 0 ? (
        <button
          onClick={() => {
            const menuEl = document.getElementById(`popup-menu-${van.id}`);
            if (menuEl) menuEl.classList.toggle("hidden");
          }}
          className="mt-2 block w-full text-center text-xs font-bold text-white rounded-lg py-1.5 px-3 cursor-pointer border-0"
          style={{ background: "linear-gradient(135deg, hsl(340,65%,55%), hsl(160,45%,50%))" }}
        >
          View Full Menu 🍦
        </button>
      ) : (
        <div className="mt-2 text-center text-xs text-gray-400">No menu available</div>
      )}

      {menu.length > 0 && (
        <div id={`popup-menu-${van.id}`} className="hidden border-t pt-2 mt-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Full Menu</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {menu.map(item => (
              <div key={item.id} className="border-b border-gray-100 pb-1">
                <div className="flex justify-between items-start text-xs">
                  <span className="text-gray-700 font-semibold">{item.item_name}</span>
                  {item.price != null && (
                    <span className="text-green-600 font-bold ml-2 whitespace-nowrap">£{item.price.toFixed(2)}</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
            Reviews ({reviews.length})
          </p>
          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {reviews.map(r => (
              <div key={r.id} className="bg-gray-50 rounded-md p-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-700">{r.reviewer_name}</span>
                  <span className="text-[10px]">{"⭐".repeat(r.rating)}</span>
                </div>
                {r.comment && <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stop Request */}
      {van.vendor_id && (
        <StopRequestButton
          vendorId={van.vendor_id}
          vendorName={van.business_name || "Ice Cream Van"}
          userLocation={userLocation || null}
          userId={userId || null}
        />
      )}
    </div>
  );
};

const VendorRoutes = ({ vans }: { vans: Van[] }) => {
  const [allRoutes, setAllRoutes] = useState<Record<string, RouteStop[]>>({});

  useEffect(() => {
    const vendorIds = vans.map(v => v.vendor_id).filter(Boolean) as string[];
    if (vendorIds.length === 0) return;

    const fetchRoutes = async () => {
      const { data } = await supabase
        .from("vendor_route_stops")
        .select("*")
        .in("vendor_id", vendorIds)
        .order("stop_order");

      if (data) {
        const grouped: Record<string, RouteStop[]> = {};
        data.forEach(stop => {
          if (!grouped[stop.vendor_id]) grouped[stop.vendor_id] = [];
          grouped[stop.vendor_id].push(stop);
        });
        setAllRoutes(grouped);
      }
    };
    fetchRoutes();
  }, [vans]);

  return (
    <>
      {Object.entries(allRoutes).map(([vendorId, stops], idx) => {
        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
        const positions: [number, number][] = stops.map(s => [s.latitude, s.longitude]);

        return (
          <div key={vendorId}>
            <Polyline
              positions={positions}
              pathOptions={{ color, weight: 3, opacity: 0.7, dashArray: "8 6" }}
            />
            {stops.map(stop => (
              <CircleMarker
                key={stop.id}
                center={[stop.latitude, stop.longitude]}
                radius={7}
                pathOptions={{ color, fillColor: "white", fillOpacity: 1, weight: 3 }}
              >
                <Popup className="modern-popup">
                  <div className="min-w-[160px]">
                    <p className="font-bold text-sm mb-0.5">📍 {stop.stop_name}</p>
                    {stop.arrival_time && (
                      <p className="text-xs text-gray-500 mb-1">🕐 Arriving at {stop.arrival_time}</p>
                    )}
                    <p className="text-[10px] text-gray-400">Stop #{stop.stop_order}</p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 block text-center text-xs font-bold text-white rounded-lg py-1 px-2"
                      style={{ background: color }}
                    >
                      Directions to Stop 🗺️
                    </a>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -8]} className="route-tooltip">
                  <span className="text-xs font-semibold">{stop.stop_name}</span>
                  {stop.arrival_time && <span className="text-xs text-gray-500 ml-1">@ {stop.arrival_time}</span>}
                </Tooltip>
              </CircleMarker>
            ))}
          </div>
        );
      })}
    </>
  );
state const [frozenPositions, setFrozenPositions] = useState<Record<string, [number, number]>>({});};

const UKMap = ({ vans, userLocation, selectedVanId, onVanSelect, userId }: UKMapProps) => {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-border relative">
      <MapContainer
        center={UK_CENTER}
        zoom={6}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
        maxBounds={[
          [48, -12],
          [62, 5],
        ]}
        minZoom={5}
      >
        <ZoomControl position="bottomright" />
        <FitBounds vans={vans} userLocation={userLocation} />
        <FlyToVan vanId={selectedVanId || null} vans={vans} frozenPositions={frozenPositions} />

<FlyToVan vanId={selectedVanId || null} vans={vans} frozenPositions={frozenPositions} />
        <TileLayer 
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Vendor route lines and stops */}
        <VendorRoutes vans={vans} />
autoPan={false} and closeOnClick={false} to Popup for stability
{vans.map((van) => {
  const position: [number, number] = frozenPositions[van.id]
    ? frozenPositions[van.id]
    : [van.latitude, van.longitude];

  return (
    <Marker
      key={van.id}
      position={position}
      icon={vanIcon}
      eventHandlers={{
        click: () => onVanSelect?.(van.id),
        popupopen: () => {
          setFrozenPositions(prev => ({
            ...prev,
            [van.id]: [van.latitude, van.longitude]
          }));
        },
        popupclose: () => {
          setFrozenPositions(prev => {
            const next = { ...prev };
            delete next[van.id];
            return next;
          });
        }
      }}
    >
      <Popup
        maxWidth={300}
        className="modern-popup"
        autoPan={false}
        closeOnClick={false}
      >
        <VanPopup van={van} userId={userId} userLocation={userLocation} />
      </Popup>
    </Marker>
  );
})}
          <Marker
            key={van.id}
            position={[van.latitude, van.longitude]}
            icon={vanIcon}
            eventHandlers={{ click: () => onVanSelect?.(van.id) }}
          >
            <Popup maxWidth={300} className="modern-popup">
              <VanPopup van={van} userId={userId} userLocation={userLocation} />
            </Popup>
          </Marker>
        ))}

        {/* User location with pulse ring */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={200}
              pathOptions={{ color: "hsl(200,75%,60%)", fillColor: "hsl(200,75%,60%)", fillOpacity: 0.1, weight: 1 }}
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup><span className="text-xs font-semibold">📍 You are here</span></Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default UKMap;
