'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import { recordManualPayment } from '@/app/admin/actions'

interface ManualPaymentManagerProps {
  clientId: string;
  unpaidInvoices: any[];
}

export default function ManualPaymentManager({ clientId, unpaidInvoices }: ManualPaymentManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedInvoice, setSelectedInvoice] = useState('')

  if (unpaidInvoices.length === 0) {
    return (
      <div className="bg-green-500/20 border border-green-500/30 p-6 rounded-2xl text-center">
        <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-green-400">Account is completely settled.</p>
      </div>
    )
  }

  const activeInvData = unpaidInvoices.find(inv => inv.id === selectedInvoice)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedInvoice) {
      toast.error('Please select an invoice to clear.')
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.append('client_id', clientId)
    formData.append('invoice_id', selectedInvoice)

    startTransition(async () => {
      const response = await recordManualPayment(formData)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Manual payment verified & recorded successfully.")
        setSelectedInvoice('')
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 p-6 rounded-[2rem] border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <Banknote className="w-4 h-4 text-green-400" />
        <h3 className="font-bold text-sm">Record Manual Deposit</h3>
      </div>
      
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Invoice</label>
        <select 
          value={selectedInvoice}
          onChange={(e) => setSelectedInvoice(e.target.value)}
          className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-green-500 appearance-none text-sm"
          required
        >
          <option value="" disabled>Select an unpaid bill...</option>
          {unpaidInvoices.map(inv => (
            <option key={inv.id} value={inv.id}>
              {new Date(inv.month_year + '-01').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} (₦{inv.total_due})
            </option>
          ))}
        </select>
      </div>

      {activeInvData && (
        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Details</label>
          <input 
            type="number" 
            name="amount" 
            defaultValue={activeInvData.total_due} 
            max={activeInvData.total_due}
            className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold outline-none focus:ring-2 focus:ring-green-500 mb-3 text-sm"
            placeholder="Amount Paid (₦)"
            required
          />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="flex items-center gap-2 p-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-700 transition">
              <input type="radio" name="payment_method" value="bank_transfer" defaultChecked className="accent-green-500" />
              <span className="text-xs font-bold">Transfer</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-700 transition">
              <input type="radio" name="payment_method" value="cash" className="accent-green-500" />
              <span className="text-xs font-bold">Cash/POS</span>
            </label>
          </div>
          <input 
            type="text" 
            name="reference" 
            className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-green-500 text-sm"
            placeholder="Teller/Ref number (Optional)"
          />
        </div>
      )}

      <button 
        type="submit"
        disabled={isPending || !selectedInvoice}
        className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 mt-4 flex justify-center items-center gap-2 shadow-lg shadow-green-500/20"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Payment'}
      </button>
    </form>
  )
}