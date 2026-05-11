'use client'

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Loader2, Maximize, Minimize, WifiOff, Camera, Upload, X, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { submitCollectionOutcome } from '@/app/driver/actions'

import iconAsset from 'leaflet/dist/images/marker-icon.png'
import iconShadowAsset from 'leaflet/dist/images/marker-shadow.png'
const iconUrl = typeof iconAsset === 'string' ? iconAsset : (iconAsset as any).src;
const shadowUrl = typeof iconShadowAsset === 'string' ? iconShadowAsset : (iconShadowAsset as any).src;
const BaseIcon = L.icon({ iconUrl, shadowUrl, iconSize:[25, 41], iconAnchor:[12, 41] })

const DriverLiveIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
  className: 'driver-live-dot',
  iconSize:[16, 16],
  iconAnchor: [8, 8]
})

function parsePostGISPoint(locationStr: string | null): [number, number] {
  if (!locationStr || !locationStr.startsWith('POINT(')) return[6.5244, 3.3792];
  const cleanStr = locationStr.slice(6, -1);
  const parts = cleanStr.split(' ');
  if (parts.length !== 2) return[6.5244, 3.3792];
  return [parseFloat(parts[1]), parseFloat(parts[0])];
}

function MapController({ coords, isFullscreen }: { coords: [number, number][], isFullscreen: boolean }) {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize() }, 250);
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding:[50, 50] })
    }
    return () => clearTimeout(timer);
  },[coords, map, isFullscreen])
  return null
}

interface OfflineAction {
  colId: string; clientName: string; address: string; timestamp: number;
}

export default function RouteMap({ collections, driverId, driverName }: { collections: any[], driverId: string, driverName: string }) {
  const[localCollections, setLocalCollections] = useState(collections)
  const [routeData, setRouteData] = useState<[number, number][]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const[driverLocation, setDriverLocation] = useState<[number, number] | null>(null)
  const[isOffline, setIsOffline] = useState(false)
  
  const [outcomeModal, setOutcomeModal] = useState<any | null>(null)
  const [outcomeType, setOutcomeType] = useState<'collected' | 'no_answer' | 'other'>('collected')
  const [outcomeFile, setOutcomeFile] = useState<File | null>(null)
  const [outcomeReason, setOutcomeReason] = useState('')
  const [isSubmittingOutcome, setIsSubmittingOutcome] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const channel = supabase.channel('truck-tracking');
    let watchId: number;

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && 'geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setDriverLocation([lat, lng]);
            channel.send({ type: 'broadcast', event: 'location_update', payload: { driverId, driverName, lat, lng } });
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
          body: JSON.stringify({ clientName: action.clientName, address: action.address }) 
        });
      } catch (e) { console.error("Sync failed", e); }
    }
    localStorage.removeItem('spotlex_offline_queue');
    toast.success("All offline collections synchronized!", { id: 'sync-toast' });
  }, [supabase]);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); processOfflineQueue(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) processOfflineQueue();
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  },[processOfflineQueue]);

  const stopCoords = useMemo(() => localCollections.map(col => parsePostGISPoint(col.properties.location)),[localCollections]);
  const coordString = useMemo(() => {
    if (stopCoords.length < 2) return null;
    return stopCoords.map(c => `${c[1]},${c[0]}`).join(';');
  },[stopCoords]);

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
      } catch (err) { console.error("TSP Optimization failed:", err); }
    };
    fetchOptimizedRoute();
  }, [coordString]);

  const handleArrived = async (col: any) => {
    setActionLoading(col.id);
    setLocalCollections(prev => prev.map(c => c.id === col.id ? { ...c, status: 'arrived' } : c));

    if (isOffline) {
      const queue: OfflineAction[] = JSON.parse(localStorage.getItem('spotlex_offline_queue') || '[]');
      queue.push({ colId: col.id, clientName: '', address: '', email: '', timestamp: Date.now() }); // Cleaned up queue payload
      localStorage.setItem('spotlex_offline_queue', JSON.stringify(queue));
      toast.info("Offline: Action logged to device queue.");
      setActionLoading(null);
      return;
    }

    try {
      const { error } = await supabase.from('collections').update({ status: 'arrived' }).eq('id', col.id);
      if (error) throw error;
      toast.success("Arrival logged successfully.");

      // Clean, secure API call. No PII sent from browser!
      await fetch('/api/notify-arrival', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: col.id })
      });
    } catch (e) {
      toast.error("Network error. Try again.");
      setLocalCollections(prev => prev.map(c => c.id === col.id ? { ...c, status: 'pending' } : c));
    } finally { setActionLoading(null); }
  };

  const submitOutcome = async () => {
    if (!outcomeModal) return;
    setIsSubmittingOutcome(true);
    let photoUrl = null;

    try {
      if (outcomeType === 'collected' && outcomeFile) {
        const fileExt = outcomeFile.name.split('.').pop();
        const fileName = `${outcomeModal.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('collection_proofs')
          .upload(fileName, outcomeFile);

        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from('collection_proofs').getPublicUrl(fileName).data.publicUrl;
      }

      const result = await submitCollectionOutcome(outcomeModal.id, outcomeType, outcomeReason, photoUrl || undefined);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setLocalCollections(prev => prev.map(c => c.id === outcomeModal.id ? { ...c, status: outcomeType } : c));
      toast.success("Collection outcome securely logged.");
      setOutcomeModal(null);
      setOutcomeFile(null);
      setOutcomeReason('');
    } catch (err: any) {
      toast.error("Failed to log outcome.");
    } finally {
      setIsSubmittingOutcome(false);
    }
  }

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-[9999] bg-slate-100" 
    : "relative h-[500px] md:h-[650px] w-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner";

  return (
    <>
      <div className={containerClasses}>
        <MapContainer center={[9.082, 8.675]} zoom={6} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {driverLocation && <Marker position={driverLocation} icon={DriverLiveIcon} zIndexOffset={1000} />}
          {stopCoords.map((pos, idx) => {
            const col = localCollections[idx];
            return (
              <Marker key={idx} position={pos} icon={BaseIcon}>
                <Popup className="spotlex-popup-wrapper">
                  <div className="p-4 space-y-4 min-w-[240px]">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                      <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-md ${col.status === 'arrived' ? 'bg-orange-100 text-orange-600' : col.status === 'collected' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        {col.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{col.properties.address_text}</p>
                    
                    {col.status === 'pending' && (
                      <button disabled={!!actionLoading} onClick={() => handleArrived(col)} className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                        {actionLoading === col.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bell className="w-3 h-3" /> Arrived at Gate</>}
                      </button>
                    )}

                    {col.status === 'arrived' && (
                      <button onClick={() => setOutcomeModal(col)} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all">
                        <CheckSquare className="w-3 h-3" /> Log Outcome
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
          {routeData.length > 0 && <Polyline positions={routeData} pathOptions={{ color: '#16a34a', weight: 6, opacity: 0.8 }} />}
          <MapController coords={stopCoords} isFullscreen={isFullscreen} />
        </MapContainer>

        {isOffline && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-orange-600 text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl animate-pulse">
            <WifiOff className="w-3 h-3" /> Offline
          </div>
        )}

        {!isFullscreen ? (
          <button onClick={() => setIsFullscreen(true)} className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur text-white p-4 rounded-2xl shadow-2xl hover:scale-105 transition-transform"><Maximize className="w-6 h-6" /></button>
        ) : (
          <button onClick={() => setIsFullscreen(false)} className="absolute bottom-8 left-8 z-[1000] bg-slate-900/90 backdrop-blur text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"><Minimize className="w-5 h-5" /> Exit Fullscreen</button>
        )}
      </div>

      {outcomeModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-lg">Log Collection Result</h3>
              <button onClick={() => setOutcomeModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Status</label>
                <div className="flex gap-2">
                  <button onClick={() => setOutcomeType('collected')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${outcomeType === 'collected' ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Collected</button>
                  <button onClick={() => setOutcomeType('no_answer')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${outcomeType === 'no_answer' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>No Answer</button>
                  <button onClick={() => setOutcomeType('other')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${outcomeType === 'other' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Other</button>
                </div>
              </div>

              {outcomeType === 'collected' && (
                <div className="space-y-3 animate-in fade-in">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proof of Collection</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 text-green-600 mb-2" />
                      <p className="text-sm font-bold text-slate-600">{outcomeFile ? outcomeFile.name : 'Tap to Open Camera'}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => setOutcomeFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              )}

              {(outcomeType === 'no_answer' || outcomeType === 'other') && (
                <div className="space-y-3 animate-in fade-in">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason / Notes</label>
                  <textarea 
                    value={outcomeReason}
                    onChange={(e) => setOutcomeReason(e.target.value)}
                    placeholder="Provide details on why collection failed..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-green-600 outline-none resize-none h-32"
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={submitOutcome}
                disabled={isSubmittingOutcome || (outcomeType === 'collected' && !outcomeFile)}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
              >
                {isSubmittingOutcome ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /> Submit & Continue Route</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}