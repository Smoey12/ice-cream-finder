import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

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
}

const UK_CENTER: [number, number] = [54.5, -2.5];
const UK_BOUNDS: [[number, number], [number, number]] = [
  [49.5, -8.5],
  [60.5, 2.5],
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

const FlyToVan = ({ vanId, vans }: { vanId: string | null; vans: Van[] }) => {
  const map = useMap();
  useEffect(() => {
    if (vanId) {
      const van = vans.find(v => v.id === vanId);
      if (van) map.flyTo([van.latitude, van.longitude], 14, { duration: 1 });
    }
  }, [vanId, map, vans]);
  return null;
};

const VanPopup = ({ van }: { van: Van }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!van.vendor_id) { setLoadingMenu(false); return; }
      const { data } = await supabase
        .from("vendor_menu_items")
        .select("id, item_name, price, description")
        .eq("vendor_id", van.vendor_id);
      setMenu(data || []);
      setLoadingMenu(false);
    };
    fetchMenu();
  }, [van.vendor_id]);

  return (
    <div className="min-w-[220px] max-w-[280px]">
      {van.van_photo_url && (
        <img
          src={van.van_photo_url}
          alt={van.business_name}
          className="w-full h-28 object-cover rounded-lg mb-2"
        />
      )}
      <h3 className="font-bold text-sm mb-0.5">🍦 {van.business_name || "Ice Cream Van"}</h3>
      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold mb-2">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        Live Now
      </span>

      {/* Menu items */}
      {loadingMenu ? (
        <p className="text-xs text-gray-400">Loading menu...</p>
      ) : menu.length > 0 ? (
        <div className="border-t pt-2 mt-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Menu</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {menu.map(item => (
              <div key={item.id} className="flex justify-between items-start text-xs">
                <span className="text-gray-700 font-medium">{item.item_name}</span>
                {item.price != null && (
                  <span className="text-gray-500 font-semibold ml-2 whitespace-nowrap">
                    £{item.price.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${van.latitude},${van.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-center text-xs font-bold text-white rounded-lg py-1.5 px-3"
        style={{ background: "linear-gradient(135deg, hsl(200,75%,60%), hsl(160,45%,50%))" }}
      >
        Get Directions 🗺️
      </a>
    </div>
  );
};

const UKMap = ({ vans, userLocation, selectedVanId, onVanSelect }: UKMapProps) => {
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
        <FlyToVan vanId={selectedVanId || null} vans={vans} />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {vans.map((van) => (
          <Marker
            key={van.id}
            position={[van.latitude, van.longitude]}
            icon={vanIcon}
            eventHandlers={{ click: () => onVanSelect?.(van.id) }}
          >
            <Popup maxWidth={300} className="modern-popup">
              <VanPopup van={van} />
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup><span className="text-xs font-semibold">📍 You are here</span></Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default UKMap;
