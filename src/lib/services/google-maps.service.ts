/**
 * Google Maps Service
 * Provides rate-limited access to Google Maps APIs
 */

/// <reference types="google.maps" />

import { getGoogleMapsApiKey } from '../firebase/config/environments';
import {
  mapsRateLimiter,
  GoogleMapsRateLimiter,
  rateLimitedCall,
  debouncer,
  throttler,
} from './rate-limiter';

// Types
export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  formattedAddress: string;
  location: LatLng;
  placeId: string;
  addressComponents: {
    longName: string;
    shortName: string;
    types: string[];
  }[];
}

export interface DirectionsResult {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  startAddress: string;
  endAddress: string;
  polyline: string; // Encoded polyline
  steps: {
    instructions: string;
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    startLocation: LatLng;
    endLocation: LatLng;
  }[];
}

export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: LatLng;
  types: string[];
  rating?: number;
  openNow?: boolean;
}

export interface DistanceMatrixResult {
  originAddresses: string[];
  destinationAddresses: string[];
  rows: {
    elements: {
      status: string;
      distance?: { text: string; value: number };
      duration?: { text: string; value: number };
    }[];
  }[];
}

/**
 * Google Maps API Service with rate limiting
 */
class GoogleMapsService {
  private static instance: GoogleMapsService | null = null;
  private apiKey: string | undefined;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    this.apiKey = getGoogleMapsApiKey();
  }

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  /**
   * Get the API key (for components that need it)
   */
  getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }
    return this.apiKey;
  }

  /**
   * Check if API key is available
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Load Google Maps JavaScript API
   */
  async loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof google !== 'undefined' && google.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Geocode an address to coordinates (rate-limited & cached)
   */
  async geocode(address: string): Promise<GeocodingResult | null> {
    if (!address.trim()) return null;

    const cacheKey = GoogleMapsRateLimiter.geocodeKey(address);

    return rateLimitedCall<GeocodingResult | null>(
      'geocode',
      async () => {
        await this.loadGoogleMaps();

        return new Promise((resolve, reject) => {
          const geocoder = new google.maps.Geocoder();

          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const result = results[0];
              resolve({
                formattedAddress: result.formatted_address,
                location: {
                  lat: result.geometry.location.lat(),
                  lng: result.geometry.location.lng(),
                },
                placeId: result.place_id,
                addressComponents: result.address_components.map(comp => ({
                  longName: comp.long_name,
                  shortName: comp.short_name,
                  types: comp.types,
                })),
              });
            } else if (status === 'ZERO_RESULTS') {
              resolve(null);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });
      },
      { cacheKey, cacheTtlMs: 3600000 } // Cache for 1 hour
    );
  }

  /**
   * Reverse geocode coordinates to address (rate-limited & cached)
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    const cacheKey = GoogleMapsRateLimiter.reverseGeocodeKey(lat, lng);

    return rateLimitedCall<GeocodingResult | null>(
      'reverse-geocode',
      async () => {
        await this.loadGoogleMaps();

        return new Promise((resolve, reject) => {
          const geocoder = new google.maps.Geocoder();
          const latlng = { lat, lng };

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const result = results[0];
              resolve({
                formattedAddress: result.formatted_address,
                location: { lat, lng },
                placeId: result.place_id,
                addressComponents: result.address_components.map(comp => ({
                  longName: comp.long_name,
                  shortName: comp.short_name,
                  types: comp.types,
                })),
              });
            } else if (status === 'ZERO_RESULTS') {
              resolve(null);
            } else {
              reject(new Error(`Reverse geocoding failed: ${status}`));
            }
          });
        });
      },
      { cacheKey, cacheTtlMs: 3600000 }
    );
  }

  /**
   * Get directions between two points (rate-limited & cached)
   */
  async getDirections(
    origin: LatLng | string,
    destination: LatLng | string,
    mode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
  ): Promise<DirectionsResult | null> {
    const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
    const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
    const cacheKey = GoogleMapsRateLimiter.directionsKey(originStr, destStr, mode);

    return rateLimitedCall<DirectionsResult | null>(
      'directions',
      async () => {
        await this.loadGoogleMaps();

        return new Promise((resolve, reject) => {
          const directionsService = new google.maps.DirectionsService();

          directionsService.route(
            {
              origin,
              destination,
              travelMode: mode,
            },
            (result, status) => {
              if (status === 'OK' && result && result.routes[0]) {
                const route = result.routes[0];
                const leg = route.legs[0];

                resolve({
                  distance: {
                    text: leg.distance?.text || '',
                    value: leg.distance?.value || 0,
                  },
                  duration: {
                    text: leg.duration?.text || '',
                    value: leg.duration?.value || 0,
                  },
                  startAddress: leg.start_address,
                  endAddress: leg.end_address,
                  polyline: route.overview_polyline,
                  steps: leg.steps.map(step => ({
                    instructions: step.instructions,
                    distance: {
                      text: step.distance?.text || '',
                      value: step.distance?.value || 0,
                    },
                    duration: {
                      text: step.duration?.text || '',
                      value: step.duration?.value || 0,
                    },
                    startLocation: {
                      lat: step.start_location.lat(),
                      lng: step.start_location.lng(),
                    },
                    endLocation: {
                      lat: step.end_location.lat(),
                      lng: step.end_location.lng(),
                    },
                  })),
                });
              } else if (status === 'ZERO_RESULTS') {
                resolve(null);
              } else {
                reject(new Error(`Directions failed: ${status}`));
              }
            }
          );
        });
      },
      { cacheKey, cacheTtlMs: 600000 } // Cache for 10 minutes
    );
  }

  /**
   * Get distance matrix between origins and destinations (rate-limited & cached)
   */
  async getDistanceMatrix(
    origins: (LatLng | string)[],
    destinations: (LatLng | string)[]
  ): Promise<DistanceMatrixResult | null> {
    const originsStr = origins.map(o => typeof o === 'string' ? o : `${o.lat},${o.lng}`);
    const destsStr = destinations.map(d => typeof d === 'string' ? d : `${d.lat},${d.lng}`);
    const cacheKey = GoogleMapsRateLimiter.distanceMatrixKey(originsStr, destsStr);

    return rateLimitedCall<DistanceMatrixResult | null>(
      'distance-matrix',
      async () => {
        await this.loadGoogleMaps();

        return new Promise((resolve, reject) => {
          const service = new google.maps.DistanceMatrixService();

          service.getDistanceMatrix(
            {
              origins,
              destinations,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
              if (status === 'OK' && response) {
                resolve({
                  originAddresses: response.originAddresses,
                  destinationAddresses: response.destinationAddresses,
                  rows: response.rows.map(row => ({
                    elements: row.elements.map(elem => ({
                      status: elem.status,
                      distance: elem.distance ? {
                        text: elem.distance.text,
                        value: elem.distance.value,
                      } : undefined,
                      duration: elem.duration ? {
                        text: elem.duration.text,
                        value: elem.duration.value,
                      } : undefined,
                    })),
                  })),
                });
              } else {
                reject(new Error(`Distance matrix failed: ${status}`));
              }
            }
          );
        });
      },
      { cacheKey, cacheTtlMs: 600000 }
    );
  }

  /**
   * Search for places with debouncing (for autocomplete)
   */
  async searchPlaces(
    query: string,
    location?: LatLng,
    radius: number = 50000
  ): Promise<PlaceResult[]> {
    if (!query.trim() || query.length < 2) return [];

    const cacheKey = GoogleMapsRateLimiter.placesSearchKey(query, location);

    // Use debouncer for user input
    return debouncer.debounce<PlaceResult[]>(
      'places-search',
      async () => {
        return rateLimitedCall<PlaceResult[]>(
          'places',
          async () => {
            await this.loadGoogleMaps();

            return new Promise((resolve, reject) => {
              // Create a dummy map element for PlacesService
              const dummyDiv = document.createElement('div');
              const service = new google.maps.places.PlacesService(dummyDiv);

              const request: google.maps.places.TextSearchRequest = {
                query,
                ...(location && {
                  location: new google.maps.LatLng(location.lat, location.lng),
                  radius,
                }),
              };

              service.textSearch(request, (results, status) => {
                if (status === 'OK' && results) {
                  resolve(
                    results.slice(0, 5).map(place => ({
                      placeId: place.place_id || '',
                      name: place.name || '',
                      formattedAddress: place.formatted_address || '',
                      location: {
                        lat: place.geometry?.location?.lat() || 0,
                        lng: place.geometry?.location?.lng() || 0,
                      },
                      types: place.types || [],
                      rating: place.rating,
                      openNow: place.opening_hours?.isOpen(),
                    }))
                  );
                } else if (status === 'ZERO_RESULTS') {
                  resolve([]);
                } else {
                  reject(new Error(`Places search failed: ${status}`));
                }
              });
            });
          },
          { cacheKey, cacheTtlMs: 300000 }
        );
      },
      400 // 400ms debounce delay
    );
  }

  /**
   * Get place autocomplete suggestions (rate-limited)
   */
  async getAutocompleteSuggestions(
    input: string,
    location?: LatLng,
    radius: number = 50000
  ): Promise<{ description: string; placeId: string }[]> {
    if (!input.trim() || input.length < 2) return [];

    return debouncer.debounce<{ description: string; placeId: string }[]>(
      'autocomplete',
      async () => {
        return rateLimitedCall<{ description: string; placeId: string }[]>(
          'autocomplete',
          async () => {
            await this.loadGoogleMaps();

            return new Promise((resolve, reject) => {
              const service = new google.maps.places.AutocompleteService();

              const request: google.maps.places.AutocompletionRequest = {
                input,
                ...(location && {
                  location: new google.maps.LatLng(location.lat, location.lng),
                  radius,
                }),
                componentRestrictions: { country: 'in' }, // Restrict to India
              };

              service.getPlacePredictions(request, (predictions, status) => {
                if (status === 'OK' && predictions) {
                  resolve(
                    predictions.map(pred => ({
                      description: pred.description,
                      placeId: pred.place_id,
                    }))
                  );
                } else if (status === 'ZERO_RESULTS') {
                  resolve([]);
                } else {
                  reject(new Error(`Autocomplete failed: ${status}`));
                }
              });
            });
          },
          { cacheTtlMs: 300000 }
        );
      },
      400 // 400ms debounce delay
    );
  }

  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(point1: LatLng, point2: LatLng): number {
    // Haversine formula for accurate distance
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Throttled location update (for live tracking)
   * Returns true if the update should be sent
   */
  shouldSendLocationUpdate(driverId: string, intervalMs: number = 3000): boolean {
    return throttler.shouldExecute(`location:${driverId}`, intervalMs);
  }

  /**
   * Get current cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return mapsRateLimiter.getCacheStats();
  }
}

// Export singleton instance
export const googleMapsService = GoogleMapsService.getInstance();

// Export the class for testing
export { GoogleMapsService };
