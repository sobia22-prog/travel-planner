"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import { getStrapiImageUrl } from "@/lib/images";
import { geocodeLocation } from "@/lib/geocoding";
import {
  FaPlane,
  FaMapMarkedAlt,
  FaMountain,
  FaHotel,
  FaUtensils,
  FaStar,
  FaDollarSign,
  FaArrowLeft,
} from "react-icons/fa";

// Dynamically import maps to avoid SSR issues
const Map = dynamic(() => import("@/components/Map"), { ssr: false });
const LocationMap = dynamic(() => import("@/components/LocationMap"), { ssr: false });

interface Destination {
  id: number;
  documentId?: string;
  name: string;
  country: string;
  description?: string;
  image?: any;
  averageDailyBudget?: number;
  latitude?: number;
  longitude?: number;
}

interface Attraction {
  id: number;
  name: string;
  category?: string;
  shortDescription?: string;
  approximateCost?: number;
  latitude?: number;
  longitude?: number;
  image?: any;
}

interface Hotel {
  id: number;
  name: string;
  stars?: number;
  pricePerNight?: number;
  isBudgetFriendly?: boolean;
  shortDescription?: string;
  latitude?: number;
  longitude?: number;
  image?: any;
}

interface Restaurant {
  id: number;
  name: string;
  cuisine?: string;
  priceLevel?: string;
  averagePricePerPerson?: number;
  shortDescription?: string;
  latitude?: number;
  longitude?: number;
  image?: any;
}

export default function DestinationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [destination, setDestination] = useState<Destination | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllAttractions, setShowAllAttractions] = useState(false);
  const [showAllHotels, setShowAllHotels] = useState(false);
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Try fetching by documentId first (Strapi v5 uses documentId for lookups)
        // The id parameter could be either numeric id or documentId string
        let destResponse: any = null;
        let fetchError: any = null;

        // Try direct lookup first
        try {
          destResponse = await apiFetch<any>(`/api/destinations/${id}?populate=*`);
        } catch (err: any) {
          fetchError = err;
          // If direct lookup fails, try using filter with documentId
          try {
            const filterResponse = await apiFetch<any>(`/api/destinations?filters[documentId][$eq]=${id}&populate=*`);
            if (filterResponse?.data && filterResponse.data.length > 0) {
              destResponse = { data: filterResponse.data[0] };
            } else {
              // Try with numeric id filter as fallback
              const numericId = parseInt(id);
              if (!isNaN(numericId)) {
                const numericFilterResponse = await apiFetch<any>(`/api/destinations?filters[id][$eq]=${numericId}&populate=*`);
                if (numericFilterResponse?.data && numericFilterResponse.data.length > 0) {
                  destResponse = { data: numericFilterResponse.data[0] };
                }
              }
            }
          } catch (filterErr: any) {
            console.error("Failed to fetch destination with filters:", filterErr);
          }
        }

        if (!destResponse) {
          console.error("Failed to fetch destination:", fetchError);
          setLoading(false);
          return;
        }

        // Debug: Log the raw response
        console.log('[DEST DETAIL RESPONSE]', destResponse);

        // Handle Strapi v5 response format: { data: { id, documentId, attributes: {...} } }
        let dest: Destination | null = null;
        if (destResponse) {
          if (destResponse.data) {
            // Strapi v5 format: { data: { id, documentId, attributes: {...} } }
            const data = destResponse.data;
            console.log('[DEST DATA]', data);

            // Check if data has attributes (nested structure)
            if (data.attributes) {
              // Extract documentId and id from top level, exclude them from attributes
              const { id: attributesId, documentId: attributesDocumentId, ...restAttributes } = data.attributes;
              dest = {
                id: data.id,
                documentId: data.documentId || attributesDocumentId,
                ...restAttributes,
              };
            } else {
              // Data is already flat (from filter response)
              dest = {
                id: data.id,
                documentId: data.documentId,
                ...data,
              };
            }
          } else if (destResponse.id || destResponse.documentId) {
            // Already in flat format
            dest = {
              ...destResponse,
              id: destResponse.id,
              documentId: destResponse.documentId,
            };
          } else if (Array.isArray(destResponse)) {
            // Array response
            const firstItem = destResponse[0];
            if (firstItem?.attributes) {
              const { id: attributesId, documentId: attributesDocumentId, ...restAttributes } = firstItem.attributes;
              dest = {
                id: firstItem.id,
                documentId: firstItem.documentId || attributesDocumentId,
                ...restAttributes,
              };
            } else {
              dest = firstItem;
            }
          }
        }

        console.log('[PARSED DEST]', dest);

        if (!dest || !dest.name) {
          console.error("Destination not found or not published", dest);
          setLoading(false);
          return;
        }

        // If destination doesn't have coordinates, try to geocode it
        if (!dest.latitude || !dest.longitude) {
          const geocodeResult = await geocodeLocation(`${dest.name}, ${dest.country}`);
          if (geocodeResult) {
            dest.latitude = geocodeResult.latitude;
            dest.longitude = geocodeResult.longitude;
            console.log('[GEOCODED DEST]', geocodeResult);
          }
        }

        console.log('Destination data:', JSON.stringify(dest, null, 2));
        console.log('Destination image:', dest.image);

        setDestination(dest);

        // Use the destination's numeric id for filtering related data
        // (relations typically use numeric id, not documentId)
        const destinationId = dest.id;

        // Fetch related data in parallel
        const [attData, hotData, resData] = await Promise.all([
          apiFetch<any>(`/api/attractions?filters[destination][id][$eq]=${destinationId}&populate=*`).catch(() => ({ data: [] })),
          apiFetch<any>(`/api/hotels?filters[destination][id][$eq]=${destinationId}&populate=*`).catch(() => ({ data: [] })),
          apiFetch<any>(`/api/restaurants?filters[destination][id][$eq]=${destinationId}&populate=*`).catch(() => ({ data: [] })),
        ]);

        // Parse attractions
        const atts = Array.isArray(attData)
          ? attData
          : (attData?.data || []).map((a: any) => ({
            id: a.id,
            ...(a.attributes || a),
          }));
        setAttractions(atts.filter((a: any) => a && a.name));

        // Parse hotels
        const hots = Array.isArray(hotData)
          ? hotData
          : (hotData?.data || []).map((h: any) => ({
            id: h.id,
            ...(h.attributes || h),
          }));
        setHotels(hots.filter((h: any) => h && h.name));

        // Parse restaurants
        const ress = Array.isArray(resData)
          ? resData
          : (resData?.data || []).map((r: any) => ({
            id: r.id,
            ...(r.attributes || r),
          }));
        setRestaurants(ress.filter((r: any) => r && r.name));
      } catch (err: any) {
        console.error("Failed to load destination:", err);
        // Don't set destination if there's an error
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading destination...</p>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <FaPlane className="mx-auto text-6xl text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Destination not found</h2>
          <p className="text-gray-600 mb-4">
            The destination with ID {id} could not be found. It may not exist or may not be published yet.
          </p>
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <FaArrowLeft />
            Back to Destinations
          </Link>
        </div>
      </div>
    );
  }

  const destinationImageUrl = getStrapiImageUrl(destination.image);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-96 bg-gradient-to-br from-blue-600 to-cyan-500">
        {destinationImageUrl ? (
          <img
            src={destinationImageUrl}
            alt={destination.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white">
            <FaPlane className="text-8xl opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/destinations"
              className="text-blue-200 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors"
            >
              <FaArrowLeft />
              Back to Destinations
            </Link>
            <h1 className="text-5xl font-bold mb-2">{destination.name}</h1>
            <p className="text-xl text-blue-100">{destination.country}</p>
            {destination.averageDailyBudget && (
              <p className="mt-2 text-lg">From ${destination.averageDailyBudget}/day</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          {/* Description Section */}
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed">
              {destination.description || `Welcome to ${destination.name}, ${destination.country}! Explore this amazing destination with our curated recommendations.`}
            </p>
          </div>

          {/* Destination Location Map */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center gap-2 mb-1">
                <FaMapMarkedAlt className="text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Destination Location</h3>
              </div>
              <p className="text-sm text-gray-600">Explore the destination on the interactive map</p>
            </div>
            <div style={{ height: "400px" }}>
              {destination.latitude && destination.longitude ? (
                <Map
                  destinations={[destination]}
                  center={[destination.latitude, destination.longitude]}
                  zoom={12}
                />
              ) : (
                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Loading map location...</p>
                </div>
              )}
            </div>
          </div>

          {/* Attractions Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaMountain className="text-2xl text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Attractions</h2>
                <span className="text-gray-500">({attractions.length})</span>
              </div>
              {attractions.length > 6 && (
                <button
                  onClick={() => setShowAllAttractions(!showAllAttractions)}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  {showAllAttractions ? "Show Less" : "See All"}
                </button>
              )}
            </div>
            {attractions.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {(showAllAttractions ? attractions : attractions.slice(0, 6)).map((att) => {
                    const imageUrl = getStrapiImageUrl(att.image);
                    return (
                      <div
                        key={att.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden"
                      >
                        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-cyan-500">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={att.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-white">
                              <FaMountain className="text-4xl opacity-50" />
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{att.name}</h3>
                          {att.category && (
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-3">
                              {att.category}
                            </span>
                          )}
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {att.shortDescription || "Explore this attraction"}
                          </p>
                          {att.approximateCost && (
                            <p className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                              <FaDollarSign className="text-xs" />
                              ${att.approximateCost}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Attractions Map */}
                {attractions.filter((a) => a.latitude && a.longitude).length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                      <h3 className="text-lg font-semibold text-gray-900">Attractions Map</h3>
                      <p className="text-sm text-gray-600">View all attractions on the map</p>
                    </div>
                    <div style={{ height: "400px" }}>
                      <LocationMap
                        locations={attractions.map((a) => ({ ...a, type: "attraction" }))}
                        center={destination.latitude && destination.longitude ? [destination.latitude, destination.longitude] : [0, 0]}
                        zoom={12}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">No attractions available yet.</p>
            )}
          </div>

          {/* Hotels Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaHotel className="text-2xl text-purple-600" />
                <h2 className="text-3xl font-bold text-gray-900">Hotels</h2>
                <span className="text-gray-500">({hotels.length})</span>
              </div>
              {hotels.length > 4 && (
                <button
                  onClick={() => setShowAllHotels(!showAllHotels)}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  {showAllHotels ? "Show Less" : "See All"}
                </button>
              )}
            </div>
            {hotels.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                  {(showAllHotels ? hotels : hotels.slice(0, 4)).map((hotel) => {
                    const imageUrl = getStrapiImageUrl(hotel.image);
                    return (
                      <div
                        key={hotel.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden"
                      >
                        <div className="relative h-56 bg-gradient-to-br from-purple-400 to-pink-500">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={hotel.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-white">
                              <FaHotel className="text-5xl opacity-50" />
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{hotel.name}</h3>
                            {hotel.stars && (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: hotel.stars }).map((_, i) => (
                                  <FaStar key={i} className="text-yellow-500" />
                                ))}
                              </div>
                            )}
                          </div>
                          {hotel.isBudgetFriendly && (
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mb-3">
                              Budget Friendly
                            </span>
                          )}
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {hotel.shortDescription || "Comfortable accommodation"}
                          </p>
                          {hotel.pricePerNight && (
                            <p className="text-xl font-semibold text-blue-600">
                              ${hotel.pricePerNight}/night
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Hotels Map */}
                {hotels.filter((h) => h.latitude && h.longitude).length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                      <h3 className="text-lg font-semibold text-gray-900">Hotels Map</h3>
                      <p className="text-sm text-gray-600">View all hotels on the map</p>
                    </div>
                    <div style={{ height: "400px" }}>
                      <LocationMap
                        locations={hotels.map((h) => ({ ...h, type: "hotel" }))}
                        center={destination.latitude && destination.longitude ? [destination.latitude, destination.longitude] : [0, 0]}
                        zoom={12}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">No hotels available yet.</p>
            )}
          </div>

          {/* Restaurants Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaUtensils className="text-2xl text-orange-600" />
                <h2 className="text-3xl font-bold text-gray-900">Restaurants</h2>
                <span className="text-gray-500">({restaurants.length})</span>
              </div>
              {restaurants.length > 4 && (
                <button
                  onClick={() => setShowAllRestaurants(!showAllRestaurants)}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  {showAllRestaurants ? "Show Less" : "See All"}
                </button>
              )}
            </div>
            {restaurants.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                  {(showAllRestaurants ? restaurants : restaurants.slice(0, 4)).map((rest) => {
                    const imageUrl = getStrapiImageUrl(rest.image);
                    return (
                      <div
                        key={rest.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden"
                      >
                        <div className="relative h-56 bg-gradient-to-br from-orange-400 to-red-500">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={rest.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-white">
                              <FaUtensils className="text-5xl opacity-50" />
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{rest.name}</h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {rest.cuisine && (
                              <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                {rest.cuisine}
                              </span>
                            )}
                            {rest.priceLevel && (
                              <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                {rest.priceLevel}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {rest.shortDescription || "Delicious cuisine"}
                          </p>
                          {rest.averagePricePerPerson && (
                            <p className="text-lg font-semibold text-blue-600">
                              ~${rest.averagePricePerPerson}/person
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Restaurants Map */}
                {restaurants.filter((r) => r.latitude && r.longitude).length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                      <h3 className="text-lg font-semibold text-gray-900">Restaurants Map</h3>
                      <p className="text-sm text-gray-600">View all restaurants on the map</p>
                    </div>
                    <div style={{ height: "400px" }}>
                      <LocationMap
                        locations={restaurants.map((r) => ({ ...r, type: "restaurant" }))}
                        center={destination.latitude && destination.longitude ? [destination.latitude, destination.longitude] : [0, 0]}
                        zoom={12}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">No restaurants available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
