'use client';

/**
 * Location Autocomplete Input
 * Google Places autocomplete with rate limiting
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { debouncer } from '@/lib/services/rate-limiter';
import { googleMapsService } from '@/lib/services/google-maps.service';
import { MapPin, Loader2, Navigation } from 'lucide-react';

export interface LocationResult {
  lat: number;
  lng: number;
  address: string;
  placeId: string;
}

interface LocationInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (location: LocationResult | null) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  restrictToIndia?: boolean;
  className?: string;
  id?: string;
  showCurrentLocation?: boolean; // New prop to show/hide current location button
}

export function LocationInput({
  label,
  placeholder = 'Enter a location...',
  value,
  onChange,
  onValueChange,
  disabled = false,
  required = false,
  error,
  restrictToIndia = true,
  className = '',
  id,
  showCurrentLocation = false,
}: LocationInputProps) {
  const { isLoaded } = useGoogleMaps();
  const [inputValue, setInputValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    
    console.log('[LocationInput] Autocomplete loaded successfully');
    
    // Configure autocomplete options with more specific settings
    autocomplete.setFields([
      'formatted_address', 
      'geometry', 
      'place_id', 
      'name',
      'address_components'
    ]);
    
    // Set options for better suggestions
    autocomplete.setOptions({
      types: ['geocode', 'establishment'], // Allow both addresses and places
      ...(restrictToIndia && { 
        componentRestrictions: { country: 'in' }
      }),
    });
    
    console.log('[LocationInput] Autocomplete configured with restrictions:', { restrictToIndia });
  }, [restrictToIndia]);

  const onPlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) {
      console.warn('[LocationInput] Autocomplete ref not available');
      return;
    }

    setIsLoading(true);

    // Use debouncer to prevent rapid API calls - 400ms delay
    debouncer.debounce(
      'place-select',
      async () => {
        const place = autocompleteRef.current?.getPlace();
        
        console.log('[LocationInput] Place selected:', place);

        if (place?.geometry?.location) {
          const location: LocationResult = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.name || '',
            placeId: place.place_id || '',
          };

          console.log('[LocationInput] Location extracted:', location);
          
          setInputValue(location.address);
          onValueChange?.(location.address);
          onChange?.(location);
        } else {
          console.warn('[LocationInput] No geometry found for place');
        }

        setIsLoading(false);
      },
      400 // 400ms debounce delay for place selection
    ).catch((err) => {
      console.error('[LocationInput] Error in place selection:', err);
      setIsLoading(false);
    });
  }, [onChange, onValueChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange?.(newValue);

    // Clear location if input is cleared
    if (!newValue) {
      onChange?.(null);
    }
  }, [onChange, onValueChange]);

  const handleBlur = useCallback(() => {
    // Cancel any pending debounced calls when leaving the field
    debouncer.cancel('place-select');
  }, []);

  // Get current location using browser geolocation
  const handleCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      console.error('[LocationInput] Geolocation not supported');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get address from coordinates
          const result = await googleMapsService.reverseGeocode(latitude, longitude);

          if (result) {
            const location: LocationResult = {
              lat: latitude,
              lng: longitude,
              address: result.formattedAddress,
              placeId: result.placeId || '',
            };

            setInputValue(location.address);
            onValueChange?.(location.address);
            onChange?.(location);
            
            console.log('[LocationInput] Current location set:', location);
          }
        } catch (err) {
          console.error('[LocationInput] Error reverse geocoding:', err);
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('[LocationInput] Geolocation error:', error);
        setGettingLocation(false);
        
        // Show user-friendly error message
        let errorMessage = 'Failed to get current location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location unavailable';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        }
        
        // You could set this as error state if needed
        console.warn(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange, onValueChange]);


  // Fallback to regular input if Google Maps not loaded
  if (!isLoaded) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <Label htmlFor={id}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={id}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            className="pl-10"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              types: ['geocode', 'establishment'],
              ...(restrictToIndia && { componentRestrictions: { country: 'in' } }),
            }}
          >
            <Input
              ref={inputRef}
              id={id}
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={disabled || gettingLocation}
              className="pl-10 pr-10"
            />
          </Autocomplete>
          {(isLoading || gettingLocation) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
        {showCurrentLocation && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCurrentLocation}
            disabled={disabled || gettingLocation}
            title="Use current location"
          >
            {gettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default LocationInput;
