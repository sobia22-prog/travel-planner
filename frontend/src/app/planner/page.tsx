"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { geocodeLocation } from "@/lib/geocoding";
import Link from "next/link";
import {
  FaPlane,
  FaUtensils,
  FaMountain,
  FaTree,
  FaTheaterMasks,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaExclamationCircle,
  FaMapMarkedAlt,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues
const LocationMap = dynamic(() => import("@/components/LocationMap"), { ssr: false });

interface Destination {
  id: number;
  name: string;
  country: string;
}

interface PlannerResponse {
  destination: { id: number; name: string; country: string; latitude?: number; longitude?: number };
  durationDays: number;
  budget: number;
  interests?: string[];
  itinerary: {
    day: number;
    title: string;
    summary: string;
    activities: {
      timeOfDay: string;
      name: string;
      type: string;
      approxCost: number;
      notes: string;
      latitude?: number;
      longitude?: number;
    }[];
  }[];
  budgetBreakdown: {
    currency: string;
    total: number;
    accommodationPerNight: number;
    foodPerDay: number;
    transportPerDay: number;
    activitiesPerDay: number;
    notes: string;
  };
}

// Get icon component based on activity type
function getActivityIcon(type: string) {
  const typeLower = type.toLowerCase();
  if (typeLower.includes("sightseeing") || typeLower.includes("monument")) {
    return <FaMountain className="text-xl text-blue-600" />;
  }
  if (typeLower.includes("food") || typeLower.includes("restaurant") || typeLower.includes("dining")) {
    return <FaUtensils className="text-xl text-orange-600" />;
  }
  if (typeLower.includes("nature") || typeLower.includes("park") || typeLower.includes("garden")) {
    return <FaTree className="text-xl text-green-600" />;
  }
  if (typeLower.includes("adventure") || typeLower.includes("sport") || typeLower.includes("hiking")) {
    return <FaMountain className="text-xl text-red-600" />;
  }
  if (typeLower.includes("culture") || typeLower.includes("museum") || typeLower.includes("theater")) {
    return <FaTheaterMasks className="text-xl text-purple-600" />;
  }
  if (typeLower.includes("shopping") || typeLower.includes("market")) {
    return <FaShoppingBag className="text-xl text-pink-600" />;
  }
  return <FaMapMarkerAlt className="text-xl text-gray-600" />;
}

export default function PlannerPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationId, setDestinationId] = useState<number | "">("");
  const [budget, setBudget] = useState(1500);
  const [duration, setDuration] = useState(5);
  const [interests, setInterests] = useState("sightseeing, food, culture");
  const [saveTrip, setSaveTrip] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlannerResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getAuthToken());
    async function loadDestinations() {
      try {
        setError(null);
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
          }).filter((d: any) => d && d.name);
        }
        
        setDestinations(dests);
      } catch (err: any) {
        console.error("Failed to load destinations:", err);
        setError(err.message || "Failed to load destinations. Please try again later.");
      }
    }
    loadDestinations();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const token = getAuthToken();
      if (!token && saveTrip) {
        setError("Please login first to save trips.");
        setLoading(false);
        return;
      }

      const body: any = {
        destinationId,
        budget,
        durationDays: duration,
        interests: interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        saveTrip: saveTrip && !!token,
      };

      if (saveTrip && token) {
        const selectedDestination = destinations.find(
          (d) => d.id === destinationId
        );
        body.title =
          title ||
          (selectedDestination
            ? `Trip to ${selectedDestination.name}`
            : "My planned trip");
        body.startDate = startDate;
        body.endDate = endDate;
      }

      const data = await apiFetch<PlannerResponse>(
        "/api/trips/plan",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        token
      );

      // If destination doesn't have coordinates, geocode it
      if (data.destination && (!data.destination.latitude || !data.destination.longitude)) {
        const selectedDestination = destinations.find((d) => d.id === destinationId);
        if (selectedDestination) {
          const geocodeResult = await geocodeLocation(`${data.destination.name}, ${data.destination.country}`);
          if (geocodeResult) {
            data.destination.latitude = geocodeResult.latitude;
            data.destination.longitude = geocodeResult.longitude;
          }
        }
      }

      // Geocode activities that don't have coordinates
      if (data.itinerary) {
        for (const day of data.itinerary) {
          if (day.activities) {
            for (const activity of day.activities) {
              if (!activity.latitude || !activity.longitude) {
                const locationQuery = `${activity.name}, ${data.destination.name}, ${data.destination.country}`;
                const geocodeResult = await geocodeLocation(locationQuery);
                if (geocodeResult) {
                  activity.latitude = geocodeResult.latitude;
                  activity.longitude = geocodeResult.longitude;
                  // Add small delay to respect rate limits
                  await new Promise(resolve => setTimeout(resolve, 1100));
                }
              }
            }
          }
        }
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate trip. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <HiSparkles className="text-4xl" />
            <h1 className="text-4xl font-bold">AI Trip Planner</h1>
          </div>
          <p className="text-blue-50">Generate personalized itineraries powered by AI</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Your Trip</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                  value={destinationId}
                  onChange={(e) => setDestinationId(Number(e.target.value))}
                  required
                >
                  <option value="">Select a destination</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}, {d.country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (USD) *
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="sightseeing, food, culture, adventure"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple interests with commas
                </p>
              </div>

              {isAuthenticated ? (
                <>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={saveTrip}
                      onChange={(e) => setSaveTrip(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Save this trip to my account
                  </label>

                  {saveTrip && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trip Title
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="My Amazing Trip"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <Link href="/auth/login" className="font-medium underline hover:text-yellow-900">
                      Login
                    </Link>{" "}
                    to save your trips and access them later.
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <FaExclamationCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-white font-semibold hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? "Generating Itinerary..." : "Generate Itinerary"}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Itinerary</h2>
            {!result && !loading && (
              <div className="text-center py-12 text-gray-500">
                <FaPlane className="mx-auto text-6xl mb-4 text-gray-300" />
                <p>Fill out the form and generate your personalized itinerary</p>
              </div>
            )}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating your perfect itinerary...</p>
              </div>
            )}
            {result && (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {result.destination?.name}, {result.destination?.country}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-blue-600" />
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-auto font-medium">{result.durationDays} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaDollarSign className="text-green-600" />
                      <span className="text-gray-600">Budget:</span>
                      <span className="ml-auto font-medium">${result.budget}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Accommodation:</span>
                      <span className="ml-auto font-medium">
                        ${result.budgetBreakdown.accommodationPerNight}/night
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Food:</span>
                      <span className="ml-auto font-medium">
                        ${result.budgetBreakdown.foodPerDay}/day
                      </span>
                    </div>
                  </div>
                </div>

                {/* Suggested Places Map - Overall */}
                {result.destination && (result.destination.latitude && result.destination.longitude) && (() => {
                  const allActivities = result.itinerary?.flatMap((day) => day.activities || []) || [];
                  const activitiesWithCoords = allActivities.filter((act) => act.latitude && act.longitude);
                  
                  if (activitiesWithCoords.length > 0) {
                    return (
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                          <div className="flex items-center gap-2 mb-1">
                            <FaMapMarkedAlt className="text-blue-600" />
                            <h3 className="text-xl font-semibold text-gray-900">Suggested Places Map</h3>
                          </div>
                          <p className="text-sm text-gray-600">Explore all suggested activities and places on the map</p>
                        </div>
                        <div style={{ height: "400px" }}>
                          <LocationMap
                            locations={activitiesWithCoords.map((act, idx) => ({
                              id: idx,
                              name: act.name,
                              latitude: act.latitude!,
                              longitude: act.longitude!,
                              description: `${act.type} - ${act.timeOfDay}`,
                              type: act.type.toLowerCase().includes("food") || act.type.toLowerCase().includes("restaurant")
                                ? "restaurant"
                                : act.type.toLowerCase().includes("hotel") || act.type.toLowerCase().includes("accommodation")
                                ? "hotel"
                                : "attraction",
                            }))}
                            center={[result.destination.latitude, result.destination.longitude]}
                            zoom={12}
                          />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Itinerary Days - Card Style */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.itinerary?.map((day) => {
                    // Get activities with coordinates for this day
                    const dayActivitiesWithCoords = day.activities?.filter(
                      (act) => act.latitude && act.longitude
                    ) || [];
                    
                    return (
                      <div
                        key={day.day}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {day.day}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                              {day.title}
                            </h4>
                            <p className="text-sm text-gray-600">{day.summary}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 pl-16">
                          {day.activities?.map((act, idx) => (
                            <div
                              key={idx}
                              className="flex gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                            >
                              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                                {getActivityIcon(act.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">{act.name}</span>
                                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap flex items-center gap-1">
                                    <FaClock className="text-xs" />
                                    {act.timeOfDay}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                    {act.type}
                                  </span>
                                  <span className="text-xs text-gray-600 flex items-center gap-1">
                                    <FaDollarSign className="text-xs" />
                                    ${act.approxCost}
                                  </span>
                                </div>
                                {act.notes && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {act.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Day-specific map if activities have coordinates */}
                        {dayActivitiesWithCoords.length > 0 && result.destination?.latitude && result.destination?.longitude && (
                          <div className="mt-4 pl-16">
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <div className="p-3 bg-gray-50 border-b border-gray-200">
                                <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                  <FaMapMarkedAlt className="text-blue-600" />
                                  Day {day.day} Locations
                                </h5>
                              </div>
                              <div style={{ height: "300px" }}>
                                <LocationMap
                                  locations={dayActivitiesWithCoords.map((act, idx) => ({
                                    id: day.day * 1000 + idx,
                                    name: act.name,
                                    latitude: act.latitude!,
                                    longitude: act.longitude!,
                                    description: `${act.type} - ${act.timeOfDay}`,
                                    type: act.type.toLowerCase().includes("food") || act.type.toLowerCase().includes("restaurant")
                                      ? "restaurant"
                                      : act.type.toLowerCase().includes("hotel") || act.type.toLowerCase().includes("accommodation")
                                      ? "hotel"
                                      : "attraction",
                                  }))}
                                  center={[result.destination.latitude, result.destination.longitude]}
                                  zoom={13}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
