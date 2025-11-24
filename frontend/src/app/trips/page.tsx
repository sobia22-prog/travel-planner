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
      window.location.href = '/auth/login';
      return;
    }

    async function loadTrips() {
      try {
        console.log('Loading trips with token:', token ? 'Token exists' : 'No token');

        // Make sure to include the token in the request
        const response = await apiFetch<any>(
          "/api/trips?populate=*",
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          },
          token
        );

        console.log('Trips API Response:', response);

        // Handle both array and object responses
        let tripsData = [];
        if (Array.isArray(response)) {
          tripsData = response;
        } else if (response?.data) {
          // Handle Strapi v4 format
          tripsData = Array.isArray(response.data) ? response.data : [response.data];
        }

        const formattedTrips = tripsData.map((trip: any) => ({
          id: trip.id,
          title: trip.attributes?.title || `Trip to ${trip.attributes?.destination?.data?.attributes?.name || 'Unknown'}`,
          startDate: trip.attributes?.startDate,
          endDate: trip.attributes?.endDate,
          durationDays: trip.attributes?.durationDays || 0,
          totalBudget: trip.attributes?.totalBudget || trip.attributes?.budget || 0,
          destination: trip.attributes?.destination?.data?.attributes
            ? {
              id: trip.attributes.destination.data.id,
              name: trip.attributes.destination.data.attributes.name,
              country: trip.attributes.destination.data.attributes.country,
            }
            : trip.attributes?.destination?.attributes
              ? {
                id: trip.attributes.destination.id,
                name: trip.attributes.destination.attributes.name,
                country: trip.attributes.destination.attributes.country,
              }
              : undefined,
          itinerary: trip.attributes?.itinerary || [],
          budgetBreakdown: trip.attributes?.budgetBreakdown || {},
        }));

        setTrips(formattedTrips);
      } catch (err: any) {
        console.error("Error loading trips:", err);

        // Handle unauthorized/forbidden errors
        if (err.message.includes('401') || err.message.includes('403')) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('travel_token');
          localStorage.removeItem('jwt');
          window.location.href = '/auth/login';
          return;
        }

        setError(err.message || "Failed to load trips. Please try again later.");
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
              <Link
                href={`/trips/${trip.id}`}
                key={trip.id}
                className="block hover:opacity-90 transition-opacity"
              >
                <div className="trip-card bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden h-full flex flex-col">
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                    <div className="text-white text-5xl">🗺️</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .trip-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .trip-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 
                      0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}