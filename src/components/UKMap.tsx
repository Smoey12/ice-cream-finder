import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const vanIcon = new L.DivIcon({
  html: '<div style="font-size:28px;text-align:center;">🚐</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: "",
});

interface Van {
  id: string;
  latitude: number;
  longitude: number;
  business_name?: string;
  van_photo_url?: string | null;
}

interface UKMapProps {
  vans: Van[];
  userLocation?: { lat: number; lng: number } | null;
}

// UK center & bounds
const UK_CENTER: [number, number] = [54.5, -2.5];
const UK_BOUNDS: [[number, number], [number, number]] = [
  [49.5, -8.5],
  [60.5, 2.5],
];

const FitUK = () => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(UK_BOUNDS, { padding: [20, 20] });
  }, [map]);
  return null;
};

const UKMap = ({ vans, userLocation }: UKMapProps) => {
  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={UK_CENTER}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        maxBounds={[
          [48, -12],
          [62, 5],
        ]}
        minZoom={5}
      >
        <FitUK />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vans.map((van) => (
          <Marker key={van.id} position={[van.latitude, van.longitude]} icon={vanIcon}>
            <Popup>
              <div className="text-center">
                {van.van_photo_url && (
                  <img
                    src={van.van_photo_url}
                    alt={van.business_name}
                    className="w-24 h-16 object-cover rounded mb-1 mx-auto"
                  />
                )}
                <strong>🍦 {van.business_name || "Ice Cream Van"}</strong>
                <br />
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${van.latitude},${van.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs underline"
                >
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>📍 You are here</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default UKMap;
