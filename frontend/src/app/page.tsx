"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getStrapiImageUrl } from "@/lib/images";
import { 
  FaRobot, 
  FaDollarSign, 
  FaMapMarkedAlt, 
  FaSave,
  FaPlane,
  FaExclamationCircle
} from "react-icons/fa";

interface Destination {
  id: number;
  documentId?: string;
  name: string;
  country: string;
  description?: string;
  image?: any;
  averageDailyBudget?: number;
}

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDestinations() {
      try {
        setError(null);
        const data = await apiFetch<any>("/api/destinations?pagination[limit]=6&populate=*");
        let dests: Destination[] = [];
        if (data) {
          const rawDests = Array.isArray(data) ? data : (data.data || []);
          dests = rawDests.map((d: any) => {
            if (d.attributes) {
              const { id: attributesId, documentId: attributesDocumentId, ...restAttributes } = d.attributes;
              return {
                id: d.id,
                documentId: d.documentId || attributesDocumentId,
                ...restAttributes,
              };
            }
            return {
              ...d,
              documentId: d.documentId || d.id,
            };
          }).filter((d: any) => d && d.name);
        }
        setDestinations(dests);
      } catch (err: any) {
        setError(err.message || "Failed to load destinations");
      } finally {
        setLoading(false);
      }
    }
    loadDestinations();
  }, []);

  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section
  className="relative flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat text-center text-white"
  style={{ backgroundImage: "url('/background.jfif')" }} 
>
  {/* Overlay */}
  <div className="absolute inset-0 bg-black/40"></div>

  {/* Background blobs */}
  <div className="absolute top-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 rounded-full bg-blue-400 opacity-20 filter blur-3xl animate-blob"></div>
  <div className="absolute bottom-0 right-10 w-[400px] h-[400px] rounded-full bg-cyan-300 opacity-20 filter blur-3xl animate-blob animation-delay-2000"></div>

  <div className="relative max-w-5xl px-6 sm:px-8 lg:px-12 py-16 sm:py-24">
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 drop-shadow-lg">
      Plan Your Perfect Trip
    </h1>
    <p className="mx-auto max-w-3xl text-base sm:text-lg md:text-xl lg:text-2xl text-blue-50 leading-relaxed mb-10 sm:mb-12 drop-shadow-md">
      AI-powered travel planning with personalized itineraries, budget estimates, and interactive maps
    </p>
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
      <Link
        href="/planner"
        className="flex items-center gap-2 justify-center rounded-xl bg-white px-8 py-4 text-blue-600 font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
      >
        <FaPlane className="transition-transform group-hover:translate-x-1" />
        Start Planning
      </Link>
      <Link
        href="/destinations"
        className="flex items-center gap-2 justify-center rounded-xl border-2 border-white/70 px-8 py-4 text-white hover:bg-white/20 transition-all duration-300"
      >
        <FaMapMarkedAlt />
        Explore Destinations
      </Link>
    </div>
  </div>
</section>


      {/* Features Section */}
<section className="relative py-32 bg-gray-50">
  <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
    {/* Section Header */}
    <div className="text-center mb-24">
      <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
        Why Choose Our Travel Planner?
      </h2>
      <p className="text-gray-600 max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl leading-relaxed">
        Everything you need to plan the perfect trip, all in one place
      </p>
    </div>

    {/* Features Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
      {[
        { icon: FaRobot, title: "AI-Powered Itineraries", desc: "Get personalized travel plans based on your preferences, budget, and interests", color: "bg-blue-600" },
        { icon: FaDollarSign, title: "Budget Estimator", desc: "Get accurate cost estimates for hotels, food, and activities before you travel", color: "bg-purple-600" },
        { icon: FaMapMarkedAlt, title: "Interactive Maps", desc: "Explore destinations with interactive maps showing attractions and routes", color: "bg-green-600" },
        { icon: FaSave, title: "Save Your Trips", desc: "Save and manage all your travel plans in one place for easy access", color: "bg-orange-600" },
      ].map((feat, i) => (
        <div
          key={i}
          className="flex flex-col items-center text-center bg-white rounded-3xl p-10 sm:p-12 shadow-lg hover:shadow-2xl transition-all duration-300 h-full"
        >
          {/* Icon */}
          <div className={`flex items-center justify-center h-24 w-24 mb-6 rounded-full text-white ${feat.color} shadow-md`}>
            <feat.icon className="text-4xl sm:text-5xl" />
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{feat.title}</h3>

          {/* Description */}
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-[220px]">
            {feat.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* Featured Destinations */}
<section className="py-32 bg-gray-50">
  <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
    {/* Header */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-16 gap-4">
      <div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
          Popular Destinations
        </h2>
        <p className="text-gray-600 text-lg sm:text-xl">
          Explore our handpicked travel destinations
        </p>
      </div>
      <Link
        href="/destinations"
        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-300 shadow-md"
      >
        View All
      </Link>
    </div>

    {/* Error Message */}
    {error && (
      <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <FaExclamationCircle className="text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-red-800 font-medium">Connection Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    )}

    {/* Loading Skeleton */}
    {loading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 bg-gray-200 rounded-3xl animate-pulse" />
        ))}
      </div>
    ) : destinations.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {destinations.map((dest, index) => {
          const imageUrl = getStrapiImageUrl(dest.image);
          return (
            <Link
              key={dest.id}
              href={`/destinations/${dest.documentId || dest.id}`}
              className="group rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={dest.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-300 text-white">
                    <FaPlane className="text-5xl opacity-50" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{dest.name}</h3>
                  <p className="text-sm sm:text-base text-blue-100 font-medium">{dest.country}</p>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <p className="text-gray-700 text-base sm:text-lg line-clamp-2 mb-4">
                  {dest.description || `Explore ${dest.name}, ${dest.country}`}
                </p>
                {dest.averageDailyBudget && (
                  <div className="flex items-center gap-2 mt-auto">
                    <FaDollarSign className="text-blue-600" />
                    <p className="text-blue-600 font-semibold">From ${dest.averageDailyBudget}/day</p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    ) : (
      <div className="text-center py-16">
        <FaPlane className="mx-auto text-5xl text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg sm:text-xl">No destinations available yet. Check back soon!</p>
      </div>
    )}
  </div>
</section>


      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg">Ready to Start Your Journey?</h2>
          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Create your account to save trips and get personalized recommendations
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-3 rounded-xl bg-yellow-400 px-10 py-4 text-blue-900 font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Get Started Free
            <FaPlane className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
