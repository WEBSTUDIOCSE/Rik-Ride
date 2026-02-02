'use client';

/**
 * Maps Test Page
 * Test Google Maps integration and autocomplete
 */

import { useState } from 'react';
import { GoogleMapsProvider, LocationInput, RideMap, type LocationResult, type Location } from '@/components/maps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, MapPin } from 'lucide-react';

export default function MapsTestPage() {
  const [pickup, setPickup] = useState<LocationResult | null>(null);
  const [dropoff, setDropoff] = useState<LocationResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const pickupLocation: Location | undefined = pickup
    ? { lat: pickup.lat, lng: pickup.lng, address: pickup.address }
    : undefined;

  const dropLocation: Location | undefined = dropoff
    ? { lat: dropoff.lat, lng: dropoff.lng, address: dropoff.address }
    : undefined;

  return (
    <GoogleMapsProvider>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Google Maps Integration Test
              </CardTitle>
              <CardDescription>
                Test autocomplete, geocoding, and map visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full"
              >
                {showInstructions ? 'Hide' : 'Show'} Instructions
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          {showInstructions && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">How to test:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Open browser console (F12) to see debug logs</li>
                    <li>Click on "Pickup Location" field</li>
                    <li>Type a location (e.g., "Belgaum" or "KLE Tech")</li>
                    <li>Wait for autocomplete suggestions dropdown</li>
                    <li>Select a suggestion from the dropdown</li>
                    <li>Repeat for "Drop Location"</li>
                    <li>Map should update with markers and route</li>
                  </ol>
                  <p className="text-sm mt-2 text-muted-foreground">
                    <strong>Note:</strong> If no suggestions appear, check console for errors and see MAPS_SETUP_GUIDE.md
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Test Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pickup Location Selected</span>
                {pickup ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Set
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Drop Location Selected</span>
                {dropoff ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Set
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Route Visualization</span>
                {pickup && dropoff ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Waiting
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location Selection</CardTitle>
              <CardDescription>
                Test the autocomplete functionality below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocationInput
                id="test-pickup"
                label="Pickup Location"
                placeholder="Type a location (e.g., Belgaum, KLE Tech University)..."
                onChange={(location) => {
                  setPickup(location);
                  console.log('[TEST] Pickup selected:', location);
                }}
                required
                restrictToIndia
              />

              <LocationInput
                id="test-dropoff"
                label="Drop Location"
                placeholder="Type a location (e.g., Belgaum Railway Station)..."
                onChange={(location) => {
                  setDropoff(location);
                  console.log('[TEST] Dropoff selected:', location);
                }}
                required
                restrictToIndia
              />

              {(pickup || dropoff) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPickup(null);
                    setDropoff(null);
                  }}
                  className="w-full"
                >
                  Clear All
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Selected Locations Display */}
          {(pickup || dropoff) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pickup && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800">Pickup</p>
                    <p className="text-sm text-green-700">{pickup.address}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Lat: {pickup.lat.toFixed(6)}, Lng: {pickup.lng.toFixed(6)}
                    </p>
                    <p className="text-xs text-green-600">
                      Place ID: {pickup.placeId}
                    </p>
                  </div>
                )}
                
                {dropoff && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800">Drop-off</p>
                    <p className="text-sm text-red-700">{dropoff.address}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Lat: {dropoff.lat.toFixed(6)}, Lng: {dropoff.lng.toFixed(6)}
                    </p>
                    <p className="text-xs text-red-600">
                      Place ID: {dropoff.placeId}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Map Visualization */}
          {(pickup || dropoff) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Map Visualization</CardTitle>
                <CardDescription>
                  {pickup && dropoff 
                    ? 'Route visualization with pickup (green) and drop (red) markers' 
                    : 'Add both locations to see route'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RideMap
                  pickup={pickupLocation}
                  dropoff={dropLocation}
                  showRoute={!!pickup && !!dropoff}
                  height="400px"
                  interactive={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Console Log Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Check Browser Console (F12)</p>
              <div className="text-sm space-y-1">
                <p>You should see logs like:</p>
                <code className="block bg-muted p-2 rounded text-xs mt-2">
                  [GoogleMaps] API loaded successfully ✓<br />
                  [GoogleMaps] Places API is available ✓<br />
                  [LocationInput] Autocomplete loaded successfully<br />
                  [LocationInput] Place selected: &#123;...&#125;
                </code>
                <p className="mt-2">
                  <strong>If you see errors:</strong> Check MAPS_SETUP_GUIDE.md for troubleshooting
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </GoogleMapsProvider>
  );
}
