/**
 * Geocoding utility to convert location names to coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName?: string;
}

/**
 * Geocode a location name to get coordinates
 * @param locationName - e.g., "Paris, France" or "Eiffel Tower, Paris"
 * @returns Promise with latitude and longitude, or null if not found
 */
export async function geocodeLocation(locationName: string): Promise<GeocodeResult | null> {
  if (!locationName || locationName.trim().length === 0) {
    return null;
  }

  try {
    // Use Nominatim API (OpenStreetMap's geocoding service)
    const encodedName = encodeURIComponent(locationName);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedName}&format=json&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TravelPlanner/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.warn('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
      };
    }

    return null;
  } catch (error) {
    console.warn('Geocoding failed for:', locationName, error);
    return null;
  }
}

/**
 * Geocode multiple locations in parallel (with rate limiting)
 * @param locations - Array of location names
 * @returns Promise with array of geocoded results (null for failed ones)
 */
export async function geocodeLocations(locations: string[]): Promise<(GeocodeResult | null)[]> {
  // Rate limit: Nominatim allows 1 request per second
  // Process sequentially with delays
  const results: (GeocodeResult | null)[] = [];
  
  for (let i = 0; i < locations.length; i++) {
    if (i > 0) {
      // Wait 1 second between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
    const result = await geocodeLocation(locations[i]);
    results.push(result);
  }
  
  return results;
}

