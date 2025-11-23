"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

interface Location {
  id: number;
  name: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  type?: "attraction" | "hotel" | "restaurant" | "destination";
  [key: string]: any;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

interface LocationMapProps {
  locations: Location[];
  center: [number, number];
  zoom: number;
  title?: string;
}

export default function LocationMap({ locations, center, zoom, title }: LocationMapProps) {
  if (typeof window === "undefined") {
    return <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading map...</div>;
  }

  const validLocations = locations.filter((loc) => loc.latitude && loc.longitude);

  // Adjust center and zoom if we have locations
  let mapCenter: [number, number] = center;
  let mapZoom = zoom;
  
  if (validLocations.length > 0) {
    const avgLat = validLocations.reduce((sum, loc) => sum + (loc.latitude || 0), 0) / validLocations.length;
    const avgLng = validLocations.reduce((sum, loc) => sum + (loc.longitude || 0), 0) / validLocations.length;
    mapCenter = [avgLat, avgLng];
    mapZoom = validLocations.length > 1 ? 13 : zoom;
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200">
      {title && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude!, loc.longitude!]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900 mb-1">{loc.name}</h3>
                {loc.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {loc.description}
                  </p>
                )}
                {loc.type && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {loc.type}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

