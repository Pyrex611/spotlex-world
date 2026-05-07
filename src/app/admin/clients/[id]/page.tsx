import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Save, User, Phone, ShieldCheck, CalendarDays, MapPin } from 'lucide-react'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'
import { updateClientProfile, updatePropertySchedule } from '@/app/admin/actions'

const DAYS =['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: client } = await supabase
    .from('profiles')
    .select('*, properties(*)')
    .eq('id', params.id)
    .single()

  if (!client) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black text-slate-900">Account not found.</h2>
        <Link href="/admin/clients" className="text-green-600 font-bold underline mt-4 inline-block">Return to Registry</Link>
      </div>
    )
  }

  // Inline Server Action for assigning collection days
  const handleScheduleUpdate = async (formData: FormData) => {
    'use server'
    const propId = formData.get('propertyId') as string
    const dayRaw = formData.get('dayOfWeek')
    if (dayRaw !== null && dayRaw !== '') {
      await updatePropertySchedule(propId, params.id, parseInt(dayRaw as string))
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6">
        <Link href="/admin/dashboard" className="p-3 bg-white border border-slate-100 rounded-2xl shadow-xl hover:bg-slate-900 hover:text-white transition-all text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <BrandLogo />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Modification Editor */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <ShieldCheck className="w-32 h-32 text-slate-900" />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 mb-2">Modify Profile</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Ref ID: {client.id.split('-')[0]}</p>
          
          <form action={updateClientProfile} className="space-y-8 relative z-10">
            <input type="hidden" name="id" value={client.id} />
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
                <input 
                  name="full_name"
                  defaultValue={client.full_name}
                  required
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Phone</label>
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
                <input 
                  name="phone"
                  defaultValue={client.phone || ''}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none shadow-inner"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" /> Commit Changes
              </button>
            </div>
          </form>
        </div>

        {/* Scheduling Assignment Editor */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-green-100 p-3 rounded-2xl">
              <CalendarDays className="w-6 h-6 text-green-700" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Collection Schedule</h1>
          </div>

          <div className="space-y-6">
            {(client.properties as any[])?.map((prop) => (
              <form key={prop.id} action={handleScheduleUpdate} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative group transition-colors hover:border-green-200">
                <input type="hidden" name="propertyId" value={prop.id} />
                
                <div className="flex items-start gap-3 mb-6">
                   <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                   <p className="text-sm font-bold text-slate-700 leading-relaxed pr-8">
                     {prop.address_text}
                   </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Collection Day</label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select 
                      name="dayOfWeek" 
                      defaultValue={prop.collection_day_of_week ?? ''} 
                      required
                      className="w-full sm:flex-1 p-4 rounded-xl border-none bg-white shadow-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-600 appearance-none"
                    >
                      <option value="" disabled>Select Day of the Week...</option>
                      {DAYS.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                    
                    <button 
                      type="submit" 
                      className="w-full sm:w-auto bg-green-600 text-white p-4 rounded-xl shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      title="Save Schedule"
                    >
                      <Save size={20} />
                    </button>
                  </div>
                </div>
              </form>
            ))}
            
            {(!client.properties || (client.properties as any