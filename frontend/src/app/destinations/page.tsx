"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getStrapiImageUrl } from "@/lib/images";
import { FaPlane, FaSearch, FaExclamationCircle } from "react-icons/fa";

interface Destination {
  id: number;
  documentId?: string; // Strapi v5 documentId for API lookups
  name: string;
  country: string;
  description?: string;
  image?: any;
  averageDailyBudget?: number;
  latitude?: number;
  longitude?: number;
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");

  useEffect(() => {
    async function loadDestinations() {
      try {
        setError(null);
        const data = await apiFetch<any>("/api/destinations?pagination[limit]=100&populate=*");
        
        // Handle Strapi v5 response format: { data: [{ id, attributes: {...} }] }
        let dests: Destination[] = [];
        if (data) {
          const rawDests = Array.isArray(data) ? data : (data.data || []);
          dests = rawDests.map((d: any) => {
            // Handle Strapi v5 format: { id, documentId, attributes: {...} }
            if (d.attributes) {
              // IMPORTANT: Preserve the top-level id and documentId
              const { id: attributesId, documentId: attributesDocumentId, ...restAttributes } = d.attributes;
              return {
                id: d.id, // Use top-level id
                documentId: d.documentId || attributesDocumentId, // Use top-level documentId (Strapi v5 stable identifier)
                ...restAttributes,
              };
            }
            // Already flat format - ensure documentId is preserved
            return {
              ...d,
              documentId: d.documentId || d.id, // Fallback to id if documentId missing
            };
          }).filter((d: any) => d && d.name);
        }
        
        setDestinations(dests);
      } catch (err: any) {
        console.error("Failed to load destinations:", err);
        setError(err.message || "Failed to load destinations");
      } finally {
        setLoading(false);
      }
    }
    loadDestinations();
  }, []);

  const countries = Array.from(
    new Set(destinations.map((d) => d.country).filter(Boolean))
  ).sort();

  const filteredDestinations = destinations.filter((dest) => {
    const matchesSearch =
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === "all" || dest.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Explore Destinations</h1>
          <p className="text-blue-50">Discover amazing places to visit around the world</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
              >
                <option value="all">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <FaExclamationCircle className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Connection Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <p className="text-red-600 text-xs mt-2">Make sure the Strapi backend is running on port 1337</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredDestinations.length > 0 ? (
          <>
            <div className="mb-6 text-sm text-gray-600">
              Showing {filteredDestinations.length} destination{filteredDestinations.length !== 1 ? "s" : ""}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDestinations.map((dest) => {
                console.log('[DEST CARD DESTINATIONS]', dest.id, dest.name, dest);
                const imageUrl = getStrapiImageUrl(dest.image);
                return (
                  <Link
                    key={dest.id}
                    href={`/destinations/${dest.documentId || dest.id}`}
                    className="group overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="relative h-56 bg-gradient-to-br from-blue-400 to-cyan-500 overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={dest.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white">
                          <FaPlane className="text-5xl opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{dest.name}</h3>
                        <p className="text-sm text-blue-100 drop-shadow">{dest.country}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {dest.description || `Discover the beauty of ${dest.name}, ${dest.country}`}
                      </p>
                      <div className="flex items-center justify-between">
                        {dest.averageDailyBudget ? (
                          <span className="text-sm font-semibold text-blue-600">
                            From ${dest.averageDailyBudget}/day
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Budget varies</span>
                        )}
                        <span className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <FaSearch className="mx-auto text-6xl mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No destinations found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
