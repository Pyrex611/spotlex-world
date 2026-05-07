'use client'

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import type { LatLngExpression, DragEndEvent } from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

// --- FIX FOR ICON CRASH ---
// Next.js handles image imports differently depending on configuration.
// It might return a string, or an object with a .src property. 
// This logic safely extracts the URL regardless of how Turbopack/Webpack bundles it.
import iconAsset from 'leaflet/dist/images/marker-icon.png';
import iconShadowAsset from 'leaflet/dist/images/marker-shadow.png';

const iconUrl = typeof iconAsset === 'string' ? iconAsset : (iconAsset as any).src;
const shadowUrl = typeof iconShadowAsset === 'string' ? iconShadowAsset : (iconShadowAsset as any).src;

const DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconSize:[25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


// --- Internal Components that live INSIDE MapContainer ---

// 1. Component to smoothly update the map's center and zoom
function MapUpdater({ center }: { center: LatLngExpression }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 17) // Use flyTo for a smooth animation, zoom to rooftop level
  },[center, map])
  return null
}

// 2. Component to handle the draggable marker and its events
function DraggableMarker({ initialPosition, onMarkerDrag }: { initialPosition: LatLngExpression, onMarkerDrag: (pos: LatLngExpression, addr: string) => void }) {
  const [position, setPosition] = useState(initialPosition)
  const markerRef = useRef<L.Marker>(null)

  // Ensure marker updates if parent changes the initial position
  useEffect(() => {
    setPosition(initialPosition)
  }, [initialPosition])

  const handleDragEnd = async (event: DragEndEvent) => {
    const marker = event.target;
    const newPosition = marker.getLatLng();
    setPosition(newPosition);

    try {
      // Reverse Geocode to get the address of the new coordinates
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${newPosition.lat}&lon=${newPosition.lng}&format=json`, {
        headers: { 'User-Agent': 'SpotlessWorld/1.0 (contact@spotlessworld.com)' }
      });
      const data = await res.json()
      onMarkerDrag(newPosition, data.display_name || 'Address not found')
    } catch (err) {
      console.error("Reverse geocoding failed", err)
      onMarkerDrag(newPosition, 'Could not fetch address')
    }
  }

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{ dragend: handleDragEnd }}
      ref={markerRef}
    />
  )
}


// --- Main Exported Component ---

interface MapProps {
  center: LatLngExpression
  markerPosition: LatLngExpression
  onMarkerDrag: (pos: LatLngExpression, addr: string) => void
}

export default function InteractiveMap({ center, markerPosition, onMarkerDrag }: MapProps) {
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', minHeight: '400px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* These components are now correctly placed as children of MapContainer */}
      <MapUpdater center={center} />
      <DraggableMarker initialPosition={markerPosition} onMarkerDrag={onMarkerDrag} />

    </MapContainer>
  )
}