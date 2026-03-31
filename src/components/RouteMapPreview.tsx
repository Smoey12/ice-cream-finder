import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Stop {
  stop_name: string;
  latitude: number;
  longitude: number;
  stop_order: number;
  arrival_time?: string;
}

interface RouteMapPreviewProps {
  stops: Stop[];
}

const RouteMapPreview = ({ stops }: RouteMapPreviewProps) => {
  if (stops.length === 0) {
    return (
      <div className="w-full h-48 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-body">Add stops to preview your route</p>
      </div>
    );
  }

  const positions: [number, number][] = stops
    .filter(s => s.stop_name.trim())
    .map(s => [s.latitude, s.longitude]);

  const bounds = positions.length > 0
    ? L.latLngBounds(positions).pad(0.3)
    : L.latLngBounds([[51.5, -0.13]], [[51.52, -0.1]]);

  return (
    <div className="w-full h-48 rounded-xl overflow-hidden border border-border">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: "hsl(340, 65%, 55%)", weight: 3, opacity: 0.8, dashArray: "8 6" }}
          />
        )}
        {stops.filter(s => s.stop_name.trim()).map((stop, idx) => (
          <CircleMarker
            key={idx}
            center={[stop.latitude, stop.longitude]}
            radius={8}
            pathOptions={{ color: "hsl(340, 65%, 55%)", fillColor: "white", fillOpacity: 1, weight: 3 }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]} className="route-tooltip">
              <span className="text-[10px] font-bold">{idx + 1}. {stop.stop_name}</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RouteMapPreview;
