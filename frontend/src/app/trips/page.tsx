"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import Link from "next/link";

interface Trip {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalBudget: number;
  destination?: {
    id: number;
    name: string;
    country: string;
  };
  itinerary?: any;
  budgetBreakdown?: any;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("Please login to view your trips.");
      setLoading(false);
      return;
    }

    async function loadTrips() {
      try {
        const data = await apiFetch<Trip[]>("/api/trips?populate=destination", {}, token);
        const tripsList = Array.isArray(data) ? data : (data as any).data || [];
        setTrips(tripsList.filter((t: any) => t && t.title));
      } catch (err: any) {
        setError(err.message || "Failed to load trips");
      } finally {
        setLoading(false);
      }
    }
    loadTrips();
  }, []);

  if (!getAuthToken()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-12 max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">
            Please login to view and manage your saved trips.
          </p>
          <Link
            href="/auth/login"
            className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-white font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">My Trips</h1>
          <p className="text-blue-50">View and manage your saved travel plans</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your trips...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No trips yet</h2>
            <p className="text-gray-600 mb-6">
              Start planning your next adventure with our AI-powered trip planner.
            </p>
            <Link
              href="/planner"
              className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-white font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg"
            >
              Plan Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                  <div className="text-white text-5xl">🗺️</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{trip.title}</h3>
                  {trip.destination ? (
                    <p className="text-sm text-gray-600 mb-4">
                      {trip.destination.name}, {trip.destination.country}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">Destination not specified</p>
                  )}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Duration:</span>
                      <span>{trip.durationDays} days</span>
                    </div>
                    {trip.startDate && trip.endDate && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Dates:</span>
                        <span>
                          {new Date(trip.startDate).toLocaleDateString()} -{" "}
                          {new Date(trip.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Budget:</span>
                      <span className="text-blue-600 font-semibold">${trip.totalBudget}</span>
                    </div>
                  </div>
                  {trip.destination && (
                    <Link
                      href={`/destinations/${trip.destination.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Destination →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
