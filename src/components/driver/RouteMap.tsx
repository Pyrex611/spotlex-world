'use client'

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navigation, Bell, Loader2, Maximize, Minimize, WifiOff, Wifi } from 'lucide-react'
import { toast } from 'sonner'

import iconAsset from 'leaflet/dist/images/marker-icon.png'
import iconShadowAsset from 'leaflet/dist/images/marker-shadow.png'
const iconUrl = typeof iconAsset === 'string' ? iconAsset : (iconAsset as any).src;
const shadowUrl = typeof iconShadowAsset === 'string' ? iconShadowAsset : (iconShadowAsset as any).src;
const BaseIcon = L.icon({ iconUrl, shadowUrl, iconSize:[25, 41], iconAnchor:[12, 41] })

// Custom icon for the Driver's live location dot
const DriverLiveIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
  className: 'driver-live-dot',
  iconSize:[16, 16],
  iconAnchor: [8, 8]
})

function parsePostGISPoint(locationStr: string | null): [number, number] {
  if (!locationStr || !locationStr.startsWith('POINT(')) return [6.5244, 3.3792];
  const cleanStr = locationStr.slice(6, -1);
  const parts = cleanStr.split(' ');
  if (parts.length !== 2) return[6.5244, 3.3792];
  return [parseFloat(parts[1]), parseFloat(parts[0])];
}

function MapController({ coords, isFullscreen }: { coords: [number, number][], isFullscreen: boolean }) {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => { map.invalidateSize() }, 100);
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] })
    }
  },[coords, map, isFullscreen])
  return null
}

interface OfflineAction {
  colId: string;
  email: string;
  clientName: string;
  address: string;
  timestamp: number;
}

export default function RouteMap({ collections, driverId, driverName }: { collections: any[], driverId: string, driverName: string }) {
  // Optimistic UI State
  const [localCollections, setLocalCollections] = useState(collections)
  const [routeData, setRouteData] = useState<[number, number][]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const[driverLocation, setDriverLocation] = useState<[number, number] | null>(null)
  const[isOffline, setIsOffline] = useState(!navigator.onLine)
  const supabase = createClient()

  // 1. Live Truck Tracking (Geolocation Broadcast)
  useEffect(() => {
    const channel = supabase.channel('truck-tracking');
    let watchId: number;

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && 'geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setDriverLocation([lat, lng]);

            // Broadcast GPS to Admin globally
            channel.send({
              type: 'broadcast',
              event: 'location_update',
              payload: { driverId, driverName, lat, lng }
            });
          },
          (err) => console.warn("GPS Tracking disabled:", err),
          { enableHighAccuracy: true, maximumAge: 15000 }
        );
      }
    });

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      supabase.removeChannel(channel);
    };
  },[driverId, driverName, supabase]);

  // 2. Offline-First Sync Engine
  const processOfflineQueue = useCallback(async () => {
    const queueRaw = localStorage.getItem('spotlex_offline_queue');
    if (!queueRaw) return;
    
    const queue: OfflineAction[] = JSON.parse(queueRaw);
    if (queue.length === 0) return;

    toast.loading(`Syncing ${queue.length} offline collections...`, { id: 'sync-toast' });

    for (const action of queue) {
      try {
        await supabase.from('collections').update({ status: 'arrived' }).eq('id', action.colId);
        await fetch('/api/notify-arrival', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: action.email, clientName: action.clientName, address: action.address })
        });
      } catch (e) {
        console.error("Queue item failed to sync", e);
      }
    }
    
    localStorage.removeItem('spotlex_offline_queue');
    toast.success("All offline collections synchronized!", { id: 'sync-toast' });
  }, [supabase]);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); processOfflineQueue(); };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    if (navigator.onLine) processOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processOfflineQueue]);

  // 3. TSP Route Optimization
  const stopCoords = useMemo(() => localCollections.map(col => parsePostGISPoint(col.properties.location)), [localCollections]);
  const coordString = useMemo(() => {
    if (stopCoords.length < 2) return null;
    return stopCoords.map(c => `${c[1]},${c[0]}`).join(';');
  }, [stopCoords]);

  useEffect(() => {
    const fetchOptimizedRoute = async () => {
      if (!coordString) return;
      try {
        const res = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coordString}?geometries=geojson&source=first`);
        const data = await res.json();
        if (data.trips && data.trips[0]) {
          const polyline = data.trips[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setRouteData(polyline);
        }
      } catch (err) {
        console.error("TSP Optimization failed:", err);
      }
    };
    fetchOptimizedRoute();
  }, [coordString]);

  // 4. Arrived Action (Optimistic & Offline-Capable)
  const handleArrived = async (col: any) => {
    setActionLoading(col.id);

    // Optimistic UI Update instantly
    setLocalCollections(prev => prev.map(c => c.id === col.id ? { ...c, status: 'arrived' } : c));

    if (isOffline || !navigator.onLine) {
      // Save to Offline Queue
      const queue: OfflineAction[] = JSON.parse(localStorage.getItem('spotlex_offline_queue') || '[]');
      queue.push({
        colId: col.id,
        email: col.properties.profiles.email,
        clientName: col.properties.profiles.full_name,
        address: col.properties.address_text,
        timestamp: Date.now()
      });
      localStorage.setItem('spotlex_offline_queue', JSON.stringify(queue));
      toast.info("Offline: Action logged to device queue.");
      setActionLoading(null);
      return;
    }

    try {
      const { error } = await supabase.from('collections').update({ status: 'arrived' }).eq('id', col.id);
      if (error) throw error;
      toast.success("Arrival logged successfully.");

      await fetch('/api/notify-arrival', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: col.properties.profiles.email, 
          clientName: col.properties.profiles.full_name,
          address: col.properties.address_text
        })
      });
    } catch (e) {
      toast.error("Network instability. Please try again.");
      // Rollback Optimistic UI on absolute failure
      setLocalCollections(prev => prev.map(c => c.id === col.id ? { ...c, status: 'pending' } : c));
    } finally {
      setActionLoading(null);
    }
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-[9999] bg-slate-100" 
    : "relative h-[500px] md:h-[650px] w-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner";

  return (
    <div className={containerClasses}>
      <MapContainer center={[9.082, 8.675]} zoom={6} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Render Driver's Live Location if acquired */}
        {driverLocation && (
          <Marker position={driverLocation} icon={DriverLiveIcon} zIndexOffset={1000} />
        )}

        {stopCoords.map((pos, idx) => (
          <Marker key={idx} position={pos} icon={BaseIcon}>
            <Popup className="spotlex-popup-wrapper">
              <div className="p-4 space-y-4 min-w-[240px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {localCollections[idx].properties.address_text}
                </p>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <button 
                    disabled={!!actionLoading || localCollections[idx].status === 'arrived' || localCollections[idx].status === 'collected'}
                    onClick={() => handleArrived(localCollections[idx])}
                    className="flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading === localCollections[idx].id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bell className="w-3 h-3" /> {localCollections[idx].status === 'pending' ? 'Arrived at Gate' : 'Action Logged'}</>}
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {routeData.length > 0 && (
          <Polyline positions={routeData} pathOptions={{ color: '#16a34a', weight: 6, opacity: 0.8 }} />
        )}
        <MapController coords={stopCoords} isFullscreen={isFullscreen} />
      </MapContainer>

      {/* Network Status Indicator */}
      {isOffline && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-orange-600 text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl animate-pulse">
          <WifiOff className="w-3 h-3" /> Operating Offline
        </div>
      )}

      {/* Fullscreen Controls */}
      {!isFullscreen ? (
        <button 
          onClick={() => setIsFullscreen(true)} 
          className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur text-white p-4 rounded-2xl shadow-2xl hover:scale-105 transition-transform"
        >
          <Maximize className="w-6 h-6" />
        </button>
      ) : (
        <button 
          onClick={() => setIsFullscreen(false)} 
          className="absolute bottom-8 left-8 z-[1000] bg-slate-900/90 backdrop-blur text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"
        >
          <Minimize className="w-5 h-5" /> Exit Fullscreen
        </button>
      )}
    </div>
  )
}