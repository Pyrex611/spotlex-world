'use client'

import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { updatePropertyLocation } from '@/app/admin/actions'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, Save, User, Home, Filter, Layers, Search, X, Crosshair, Maximize, Minimize, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import iconAsset from 'leaflet/dist/images/marker-icon.png'
import iconShadowAsset from 'leaflet/dist/images/marker-shadow.png'
const iconUrl = typeof iconAsset === 'string' ? iconAsset : (iconAsset as any).src;
const shadowUrl = typeof iconShadowAsset === 'string' ? iconShadowAsset : (iconShadowAsset as any).src;

const DefaultIcon = L.icon({ 
  iconUrl, 
  shadowUrl, 
  iconSize: [25, 41], 
  iconAnchor: [12, 41] 
})

const EditIcon = L.icon({ 
  iconUrl, 
  shadowUrl, 
  iconSize: [35, 50], 
  iconAnchor:[17, 50], 
  className: 'hue-rotate-[140deg] saturate-200 brightness-110' 
})

// Custom animated icon for live trucks on the Admin map
const LiveTruckIcon = L.divIcon({
  html: `<div style="background-color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; width: 32px; height: 32px; box-shadow: 0 4px 10px rgba(22, 163, 74, 0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h12Z"/><path d="M14 8h4.38a2 2 0 0 1 1.6.82l2.3 3.44A2 2 0 0 1 22.5 13.5V17h-2.5"/><path d="M8 17.5A2.5 2.5 0 1 1 5.5 15 2.5 2.5 0 0 1 8 17.5Z"/><path d="M21 17.5A2.5 2.5 0 1 1 18.5 15 2.5 2.5 0 0 1 21 17.5Z"/></svg></div>`,
  className: 'live-truck-marker animate-bounce',
  iconSize: [32, 32],
  iconAnchor:[16, 16]
});

// Robust PostGIS Parser
function parsePostGISPoint(locationStr: string | null): [number, number] {
  if (!locationStr || !locationStr.startsWith('POINT(')) return[6.5244, 3.3792];
  const cleanStr = locationStr.slice(6, -1);
  const parts = cleanStr.split(' ');
  if (parts.length !== 2) return [6.5244, 3.3792];
  return[parseFloat(parts[1]), parseFloat(parts[0])];
}

function MapController({ targetBounds, targetPos, isFullscreen }: { targetBounds?: L.LatLngBounds, targetPos?: [number, number], isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize() }, 100);
    if (targetBounds) {
      map.flyToBounds(targetBounds, { padding: [50, 50], duration: 1.5 });
    } else if (targetPos) {
      map.flyTo(targetPos, 18, { duration: 1.5 });
    }
  }, [targetBounds, targetPos, isFullscreen, map]);
  return null;
}

interface GlobalAdminMapProps {
  properties: any[];
  todayPropertyIds: string[];
}

function MapInternal({ properties, todayPropertyIds }: GlobalAdminMapProps) {
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const supabase = createClient();

  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const[editingItem, setEditingItem] = useState<any | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [tempPos, setTempPos] = useState<[number, number] | null>(null);
  const [mapTarget, setMapTarget] = useState<{bounds?: L.LatLngBounds, pos?: [number, number]}>({});
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // State for live moving trucks
  const [activeTrucks, setActiveTrucks] = useState<Record<string, { lat: number, lng: number, name: string }>>({});

  useEffect(() => {
    // Listen to Truck Broadcasts
    const channel = supabase.channel('truck-tracking')
      .on('broadcast', { event: 'location_update' }, (payload) => {
        const { driverId, driverName, lat, lng } = payload.payload;
        setActiveTrucks(prev => ({
          ...prev,
          [driverId]: { lat, lng, name: driverName }
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    if (editId) {
      const target = properties.find(p => p.id === editId);
      if (target) {
        setViewMode('all');
        setEditingItem(target);
        setEditAddress(target.address_text);
        const pos = parsePostGISPoint(target.location);
        setTempPos(pos);
        setMapTarget({ pos });
      }
    } else if (properties.length > 0) {
      const filtered = viewMode === 'today' 
        ? properties.filter(p => todayPropertyIds.includes(p.id))
        : properties;
      if (filtered.length > 0) {
        const b = L.latLngBounds(filtered.map(p => parsePostGISPoint(p.location)));
        setMapTarget({ bounds: b });
      }
    }
  },[editId, viewMode, properties, todayPropertyIds]);

  const filteredProperties = viewMode === 'today' 
    ? properties.filter(p => todayPropertyIds.includes(p.id))
    : properties;

  const handleAddressSearch = async () => {
    if (!editAddress) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(editAddress)}&format=json&limit=1&countrycodes=ng`, { headers: { 'User-Agent': 'SpotlexWorld/1.0' } });
      const data = await res.json();
      if (data && data[0]) {
        const newPos: [number, number] =[parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setTempPos(newPos);
        const bbox = data[0].boundingbox;
        const b = L.latLngBounds([bbox[0], bbox[2]], [bbox[1], bbox[3]]);
        
        const isSmallArea = b.getNorthWest().distanceTo(b.getSouthEast()) < 500;
        if (isSmallArea) { setMapTarget({ pos: newPos }); } 
        else { setMapTarget({ bounds: b }); }
        toast.success("Location found and pinned.");
      } else {
        toast.error("Location not found in Nigeria.");
      }
    } catch (e) { toast.error("Search failed. Please try again."); } 
    finally { setSearchLoading(false); }
  };

  const handleSave = async () => {
    if (!tempPos || !editingItem) return
    setLoading(true)
    try {
      await updatePropertyLocation(editingItem.id, tempPos[0], tempPos[1], editAddress)
      setEditingItem(null); setTempPos(null);
      toast.success("Location successfully relocated.");
    } catch (e) { toast.error("Failed to save location."); } 
    finally { setLoading(false) }
  }

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-[9999] bg-white" 
    : "relative h-full w-full group";

  return (
    <div className={containerClasses}>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] transition-transform group-hover:translate-y-1">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1">
          <button 
            onClick={() => setViewMode('today')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'today' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Filter className="w-3.5 h-3.5" /> TODAY'S ROUTE
          </button>
          <button 
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'all' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Layers className="w-3.5 h-3.5" /> ALL ASSETS
          </button>
        </div>
      </div>

      {editingItem && (
        <div className="absolute top-6 right-6 bottom-6 w-full max-w-[400px] z-[1001] animate-in slide-in-from-right duration-500">
          <div className="h-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Correct Spot</h3>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest italic">{editingItem.profiles?.full_name}</p>
              </div>
              <button onClick={() => {setEditingItem(null); setTempPos(null);}} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-8 flex-1 space-y-8 overflow-y-auto">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identify by Address</label>
                <div className="relative">
                   <textarea value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-green-600 transition-all outline-none resize-none" placeholder="Enter city, street or house details..." />
                   <button onClick={handleAddressSearch} disabled={searchLoading} className="absolute bottom-3 right-3 bg-white shadow-md p-2.5 rounded-xl text-slate-600 hover:text-green-600 transition-colors">
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                   </button>
                </div>
              </div>
              <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 p-2 rounded-lg shadow-lg shadow-green-200"><Crosshair className="w-4 h-4 text-white" /></div>
                  <h4 className="text-sm font-bold text-green-900">Pin Precision</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-green-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Latitude</p><p className="text-xs font-mono text-slate-700">{tempPos?.[0].toFixed(6)}</p></div>
                  <div className="bg-white p-3 rounded-xl border border-green-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Longitude</p><p className="text-xs font-mono text-slate-700">{tempPos?.[1].toFixed(6)}</p></div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <button onClick={handleSave} disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-slate-200 transition-all active:scale-95">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Update Asset Location</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <MapContainer center={[9.0820, 8.6753]} zoom={6} zoomControl={false} style={{ height: '100%', width: '100%', background: '#f8fafc' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Render Live Vehicles */}
        {Object.values(activeTrucks).map((truck, idx) => (
          <Marker key={`truck-${idx}`} position={[truck.lat, truck.lng]} icon={LiveTruckIcon} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -20]} className="premium-tooltip-admin" permanent>
               <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div> {truck.name}'s Truck</span>
            </Tooltip>
          </Marker>
        ))}

        {filteredProperties.map((prop) => {
          const pos = parsePostGISPoint(prop.location)
          const isEditing = editingItem?.id === prop.id

          return (
            <Marker key={prop.id} position={isEditing && tempPos ? tempPos : pos} icon={isEditing ? EditIcon : DefaultIcon} draggable={isEditing} eventHandlers={{ dragend: (e) => setTempPos([e.target.getLatLng().lat, e.target.getLatLng().lng]) }}>
              <Popup className="spotlex-popup-wrapper">
                <div className="p-4 space-y-4 min-w-[240px] bg-white">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2.5 rounded-xl"><User className="w-4 h-4 text-slate-600" /></div>
                    <div><p className="font-bold text-slate-900 text-sm leading-tight">{prop.profiles?.full_name}</p><p className="text-[10px] text-slate-400 font-black uppercase mt-1">SpotlexWorld Client</p></div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-1.5 text-slate-400"><Home className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-tight">Verified Address</span></div>
                     <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100/50">{prop.address_text}</p>
                  </div>
                  {!editingItem && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button onClick={() => { setEditingItem(prop); setEditAddress(prop.address_text); setTempPos(pos) }} className="bg-slate-900 text-white py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-black transition-all"><MapPin className="w-3 h-3" /> Adjust</button>
                      <Link href={`/admin/clients/${prop.client_id}`} className="bg-green-600 text-white py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-green-700 transition-all shadow-lg shadow-green-200"><CalendarDays className="w-3 h-3" /> Details</Link>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        <MapController targetBounds={mapTarget.bounds} targetPos={mapTarget.pos} isFullscreen={isFullscreen} />
      </MapContainer>

      {!isFullscreen ? (
        <button onClick={() => setIsFullscreen(true)} className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur text-white p-4 rounded-2xl shadow-2xl hover:scale-105 transition-transform"><Maximize className="w-6 h-6" /></button>
      ) : (
        <button onClick={() => setIsFullscreen(false)} className="absolute bottom-8 left-8 z-[1000] bg-slate-900/90 backdrop-blur text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"><Minimize className="w-5 h-5" /> Exit Fullscreen</button>
      )}
    </div>
  )
}

export default function GlobalAdminMap(props: GlobalAdminMapProps) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-slate-50 animate-pulse" />}>
      <MapInternal {...props} />
    </Suspense>
  )
}