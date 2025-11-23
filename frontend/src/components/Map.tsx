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

interface Destination {
  id: number;
  name: string;
  country: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  averageDailyBudget?: number;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

interface MapProps {
  destinations: Destination[];
  center: [number, number];
  zoom: number;
  onMarkerClick?: (dest: Destination) => void;
}

export default function Map({ destinations, center, zoom, onMarkerClick }: MapProps) {
  if (typeof window === "undefined") {
    return <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading map...</div>;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <MapController center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {destinations.map((dest) => (
        <Marker
          key={dest.id}
          position={[dest.latitude!, dest.longitude!]}
          eventHandlers={{
            click: () => onMarkerClick?.(dest),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-gray-900 mb-1">{dest.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{dest.country}</p>
              {dest.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {dest.description}
                </p>
              )}
              {dest.averageDailyBudget && (
                <p className="text-xs font-medium text-blue-600 mb-2">
                  From ${dest.averageDailyBudget}/day
                </p>
              )}
              <a
                href={`/destinations/${dest.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                View Details →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

