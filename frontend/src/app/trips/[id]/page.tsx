"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { geocodeLocation } from "@/lib/geocoding";
import Link from "next/link";
import { FaArrowLeft, FaCalendarAlt, FaDollarSign, FaMapMarkerAlt, FaGlobe, FaMapMarkedAlt, FaClock } from "react-icons/fa";
import dynamic from 'next/dynamic';

const Map = dynamic(
    () => import('@/components/Map'),
    {
        ssr: false,
        loading: () => <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading map...</div>
    }
);

const LocationMap = dynamic(
    () => import('@/components/LocationMap'),
    { ssr: false }
);

interface Trip {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    totalBudget: number;
    budget: number;
    interests: string[];
    destination: {
        id: number;
        name: string;
        country: string;
        description?: string;
        latitude?: number;
        longitude?: number;
    };
    itinerary: Array<{
        day: number;
        title: string;
        summary: string;
        activities: Array<{
            timeOfDay: string;
            name: string;
            type: string;
            approxCost: number;
            notes: string;
            latitude?: number;
            longitude?: number;
        }>;
    }>;
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

export default function TripDetailPage() {
    const { id } = useParams();
    const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
    const [mapZoom, setMapZoom] = useState(3);
    const [showMap, setShowMap] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [activityGeocoding, setActivityGeocoding] = useState<Record<string, boolean>>({});
    const router = useRouter();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleGeocodeLocation = async (locationName: string, country: string, activityId?: string) => {
        try {
            if (activityId) {
                setActivityGeocoding(prev => ({ ...prev, [activityId]: true }));
            } else {
                setGeocoding(true);
            }

            const query = `${locationName}, ${country}`;
            const result = await geocodeLocation(query);

            if (result) {
                if (activityId) {
                    // Update the specific activity with coordinates
                    setTrip(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            itinerary: prev.itinerary.map(day => ({
                                ...day,
                                activities: day.activities.map(act =>
                                    `day${day.day}-${act.name}` === activityId
                                        ? { ...act, latitude: result.latitude, longitude: result.longitude }
                                        : act
                                )
                            }))
                        };
                    });
                } else {
                    // Update destination coordinates
                    setMapCenter([result.latitude, result.longitude]);
                    setMapZoom(12);
                    setShowMap(true);

                    setTrip(prev => prev ? {
                        ...prev,
                        destination: {
                            ...prev.destination,
                            latitude: result.latitude,
                            longitude: result.longitude
                        }
                    } : prev);
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('Geocoding error:', error);
            return false;
        } finally {
            if (activityId) {
                setActivityGeocoding(prev => ({ ...prev, [activityId]: false }));
            } else {
                setGeocoding(false);
            }
        }
    };

    useEffect(() => {
        const initializeMap = async () => {
            if (trip?.destination) {
                const { latitude, longitude, name, country } = trip.destination;

                if (latitude && longitude) {
                    setMapCenter([latitude, longitude]);
                    setMapZoom(12);
                    setShowMap(true);
                } else if (name && country) {
                    await handleGeocodeLocation(name, country);
                }
            }
        };

        initializeMap();
    }, [trip?.destination]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'Invalid date';
        }
    };

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.push('/auth/login');
            return;
        }

        async function loadTrip() {
            try {
                console.log('Fetching trip with ID:', id, 'Token exists:', !!token);
                const response = await apiFetch<any>(
                    `/api/trips/${id}?populate=*`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    },
                    token
                );

                console.log('Trip API Response:', response);

                // Transform the response to match our Trip interface
                const tripData = response.data?.attributes ? {
                    id: response.data.id,
                    title: response.data.attributes.title || 'Untitled Trip',
                    startDate: response.data.attributes.startDate,
                    endDate: response.data.attributes.endDate,
                    durationDays: response.data.attributes.durationDays || 0,
                    budget: response.data.attributes.budget || 0,
                    interests: Array.isArray(response.data.attributes.interests)
                        ? response.data.attributes.interests
                        : [],
                    destination: response.data.attributes.destination?.data?.attributes
                        ? {
                            id: response.data.attributes.destination.data.id,
                            name: response.data.attributes.destination.data.attributes.name || 'Unknown',
                            country: response.data.attributes.destination.data.attributes.country || 'Unknown',
                            description: response.data.attributes.destination.data.attributes.description
                        }
                        : { id: 0, name: 'Unknown', country: 'Unknown' },
                    itinerary: Array.isArray(response.data.attributes.itinerary)
                        ? response.data.attributes.itinerary
                        : [],
                    budgetBreakdown: response.data.attributes.budgetBreakdown || {
                        currency: 'USD',
                        total: 0,
                        accommodationPerNight: 0,
                        foodPerDay: 0,
                        transportPerDay: 0,
                        activitiesPerDay: 0,
                        notes: ''
                    }
                } : null;

                setTrip(tripData);
            } catch (err: any) {
                console.error('Error loading trip:', err);
                if (err.message?.includes('401') || err.message?.includes('403')) {
                    // Clear invalid token and redirect to login
                    localStorage.removeItem('travel_token');
                    localStorage.removeItem('jwt');
                    router.push('/auth/login');
                } else {
                    setError(err.message || "Failed to load trip details");
                }
            } finally {
                setLoading(false);
            }
        }

        loadTrip();
    }, [id, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading trip details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/trips')}
                        className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-all"
                    >
                        Back to My Trips
                    </button>
                </div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
                    <p className="text-gray-600 mb-6">The requested trip could not be found.</p>
                    <Link
                        href="/trips"
                        className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-all"
                    >
                        Back to My Trips
                    </Link>
                </div>
            </div>
        );
    }

    const handleActivityGeocode = async (activity: any, dayNumber: number) => {
        const activityId = `day${dayNumber}-${activity.name}`;
        if (!activity.latitude || !activity.longitude) {
            await handleGeocodeLocation(
                activity.name,
                trip?.destination.country || '',
                activityId
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-8 text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center">
                        <button
                            onClick={() => router.back()}
                            className="mr-4 p-2 rounded-full hover:bg-blue-700 transition-colors"
                        >
                            <FaArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold">{trip.title}</h1>

                            <div className="flex items-center mt-1 space-x-4 text-sm text-blue-100">
                                <span className="flex items-center">
                                    <FaMapMarkerAlt className="mr-1" />
                                    {trip.destination.name}, {trip.destination.country}
                                </span>

                                <span className="flex items-center">
                                    <FaCalendarAlt className="mr-1" />
                                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                </span>

                                <span className="flex items-center">
                                    <FaDollarSign className="mr-1" />
                                    ${trip.budget?.toLocaleString() || '0'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Overview */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip Overview</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">Destination</h3>
                            <p className="text-gray-700">{trip.destination.name}, {trip.destination.country}</p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-green-800 mb-2">Duration</h3>
                            <p className="text-gray-700">{trip.durationDays} days</p>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-purple-800 mb-2">Total Budget</h3>
                            <p className="text-gray-700">${trip.totalBudget?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                </div>

                {/* Itinerary */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Itinerary</h2>

                    <div className="space-y-8">

                        {trip.itinerary.map((day, dayIndex) => {
                            const dayActivitiesWithCoords = day.activities.filter(a => a.latitude && a.longitude);
                            const dayHasCoords = dayActivitiesWithCoords.length > 0;

                            return (
                                <div key={dayIndex} className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4">
                                        <h3 className="text-xl font-bold text-white">
                                            Day {day.day}: {day.title}
                                        </h3>
                                    </div>

                                    <div className="p-6">
                                        <p className="text-gray-700 mb-6">{day.summary}</p>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Activities List */}
                                            <div className="space-y-4">
                                                {day.activities.map((activity, actIndex) => (
                                                    <div key={actIndex} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                                                                    <span className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
                                                                        <FaClock className="text-xs mr-1" />
                                                                        {activity.timeOfDay}
                                                                    </span>
                                                                </div>
                                                                {activity.notes && (
                                                                    <p className="text-sm text-gray-600 mt-2">{activity.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Map */}
                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-96 lg:h-auto">
                                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 border-b border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                                                            <FaMapMarkedAlt className="text-blue-600" />
                                                            Day {day.day} Locations
                                                        </h4>
                                                        {Object.values(activityGeocoding).some(v => v) && (
                                                            <div className="flex items-center text-xs text-blue-600">
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                                                                Updating map...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-80 w-full">
                                                    <LocationMap
                                                        locations={day.activities
                                                            .filter(act => act.name)
                                                            .map((act, idx) => ({
                                                                id: day.day * 1000 + idx,
                                                                name: act.name,
                                                                latitude: act.latitude || 0,
                                                                longitude: act.longitude || 0,
                                                                type: act.type?.toLowerCase().includes('food') || act.type?.toLowerCase().includes('restaurant')
                                                                    ? 'restaurant'
                                                                    : act.type?.toLowerCase().includes('hotel') || act.type?.toLowerCase().includes('accommodation')
                                                                        ? 'hotel'
                                                                        : 'attraction',
                                                                description: `${act.type} - ${act.timeOfDay}`,
                                                                timeOfDay: act.timeOfDay,
                                                                hasCoords: !!(act.latitude && act.longitude)
                                                            }))}
                                                        center={[
                                                            dayActivitiesWithCoords[0]?.latitude || trip.destination.latitude || 0,
                                                            dayActivitiesWithCoords[0]?.longitude || trip.destination.longitude || 0
                                                        ]}
                                                        zoom={13}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </div>

                {/* END itinerary */}
            </div>
        </div>
    );
}
