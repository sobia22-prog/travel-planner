"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { FaMapMarkedAlt, FaDollarSign, FaExclamationCircle } from "react-icons/fa";

// Dynamically import map to avoid SSR issues
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface Destination {
  id: number;
  name: string;
  country: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  averageDailyBudget?: number;
}

export default function MapPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);

  useEffect(() => {
    // Check for URL params (from destination detail page)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const lat = params.get("lat");
      const lng = params.get("lng");
      const zoom = params.get("zoom");
      if (lat && lng) {
        setMapCenter([parseFloat(lat), parseFloat(lng)]);
        setMapZoom(zoom ? parseInt(zoom) : 12);
      }
    }

    async function loadDestinations() {
      try {
        const data = await apiFetch<any>("/api/destinations?pagination[limit]=100&populate=*");

        // Handle Strapi v5 response format: { data: [{ id, attributes: {...} }] }
        let dests: Destination[] = [];
        if (data) {
          const rawDests = Array.isArray(data) ? data : (data.data || []);
          dests = rawDests.map((d: any) => {
            // Handle Strapi v5 format: { id, attributes: {...} }
            if (d.attributes) {
              // IMPORTANT: Preserve the top-level id, don't let attributes.id override it
              const { id: attributesId, ...restAttributes } = d.attributes;
              return {
                id: d.id, // Use top-level id (this is the correct database ID)
                ...restAttributes,
              };
            }
            // Already flat format
            return d;
          });
        }

        const validDests = dests.filter(
          (d: any) => d && d.name && d.latitude && d.longitude
        );
        setDestinations(validDests);
        if (validDests.length > 0 && !lat && !lng) {
          const first = validDests[0];
          setMapCenter([first.latitude!, first.longitude!]);
          setMapZoom(6);
        }
      } catch (err) {
        console.error("Failed to load destinations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDestinations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-8 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <FaMapMarkedAlt className="text-4xl" />
            <h1 className="text-4xl font-bold">Interactive Map</h1>
          </div>
          <p className="text-blue-50">Explore destinations and attractions on the map</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Destinations ({destinations.length})
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading destinations...</p>
                </div>
              ) : destinations.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {destinations.map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => {
                        setSelectedDestination(dest);
                        setMapCenter([dest.latitude!, dest.longitude!]);
                        setMapZoom(12);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedDestination?.id === dest.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                    >
                      <h3 className="font-semibold text-gray-900">{dest.name}</h3>
                      <p className="text-sm text-gray-600">{dest.country}</p>
                      {dest.averageDailyBudget && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <FaDollarSign className="text-xs" />
                          From {dest.averageDailyBudget}/day
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No destinations with coordinates available.</p>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: "700px" }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              ) : (
                <Map
                  destinations={destinations}
                  center={mapCenter}
                  zoom={mapZoom}
                  onMarkerClick={setSelectedDestination}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
