'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Loader2, CheckCircle2, Navigation, LocateFixed } from 'lucide-react'
import { savePropertyLocation } from '@/app/client/actions'
import dynamic from 'next/dynamic'
import type { LatLngExpression } from 'leaflet'
import { toast } from 'sonner'

interface NominatimResult {
  place_id: number; display_name: string; lat: string; lon: string;
}

const DEFAULT_CENTER: LatLngExpression =[6.5244, 3.3792]

export default function AddressGeocoder() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const[loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(DEFAULT_CENTER)
  const[markerPosition, setMarkerPosition] = useState<LatLngExpression>(DEFAULT_CENTER)
  const[selectedAddress, setSelectedAddress] = useState('')

  const Map = useMemo(() => dynamic(() => import('./InteractiveMap'), {
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-medium">Initializing Map...</div>,
    ssr: false
  }),[])

  useEffect(() => {
    if (!query || selectedAddress === query) {
      setResults([]); return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ng`, { headers: { 'User-Agent': 'SpotlexWorld/1.0' } })
        const data = await res.json()
        setResults(data)
      } catch (err) {
        toast.error('Search failed to connect to satellite.');
      } finally { setLoading(false) }
    }, 800)
    return () => clearTimeout(delayDebounceFn)
  }, [query, selectedAddress])

  const handleSelectAddress = (item: NominatimResult) => {
    const position: LatLngExpression = [parseFloat(item.lat), parseFloat(item.lon)]
    setQuery(item.display_name)
    setSelectedAddress(item.display_name)
    setMapCenter(position)
    setMarkerPosition(position)
    setResults([])
    toast.info("Location pinned. You can drag the pin for precision.");
  }

  const handleMarkerDrag = (newPosition: LatLngExpression, newAddress: string) => {
    setMarkerPosition(newPosition)
    setQuery(newAddress)
    setSelectedAddress(newAddress)
  }

  const handleUseCurrentLocation = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos: LatLngExpression = [latitude, longitude];
        setMapCenter(newPos)
        setMarkerPosition(newPos)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { headers: { 'User-Agent': 'SpotlexWorld/1.0' }})
        .then(res => res.json()).then(data => {
          const addr = data.display_name || 'Current Location';
          setQuery(addr); setSelectedAddress(addr);
          toast.success("GPS Location acquired.");
        });
        setLoading(false)
      },
      () => {
        toast.error("GPS access denied. Please search manually.");
        setLoading(false)
      }
    );
  }
  
  const handleSave = async () => {
    if (!selectedAddress) { toast.error("Please confirm an address first."); return; }
    setSaving(true)
    try {
      const posArray = Array.isArray(markerPosition) ? markerPosition : [markerPosition.lat, markerPosition.lng];
      await savePropertyLocation(selectedAddress, posArray[0].toString(), posArray[1].toString())
      toast.success("Location securely saved.");
    } catch (err: any) {
      toast.error(err.message || 'Saving failed.');
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden max-w-5xl w-full">
      <div className="p-8 border-b border-slate-50">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Location Setup</h2>
        <p className="text-slate-500 text-sm mt-1">Pinpoint your residence for automated collection scheduling.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 p-8 space-y-6 border-r border-slate-50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your street address..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-green-600 transition-all outline-none"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 animate-spin" />}
            
            {results.length > 0 && (
              <ul className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 overflow-hidden">
                {results.map((item) => (
                  <li key={item.place_id} onClick={() => handleSelectAddress(item)} className="px-5 py-4 hover:bg-slate-50 cursor-pointer flex items-start gap-3 border-b border-slate-50">
                    <Navigation className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-sm text-slate-600 font-medium">{item.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-100">
            <Map center={mapCenter} markerPosition={markerPosition} onMarkerDrag={handleMarkerDrag} />
          </div>
          <button onClick={handleUseCurrentLocation} className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition">
            <LocateFixed className="w-4 h-4" /> Use Device GPS
          </button>
        </div>

        <div className="bg-slate-50/50 p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Current Selection</label>
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <p className="text-sm text-slate-700 font-semibold leading-relaxed">{selectedAddress || "No location selected"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Precision Coordinates</label>
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm font-mono text-[11px] text-slate-500">
                {Array.isArray(markerPosition) ? `${markerPosition[0].toFixed(6)}, ${markerPosition[1].toFixed(6)}` : `${markerPosition.lat.toFixed(6)}, ${markerPosition.lng.toFixed(6)}`}
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={!selectedAddress || saving} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-20 shadow-xl">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Confirm Address</>}
          </button>
        </div>
      </div>
    </div>
  )
}