'use client';

import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PaystackCheckoutButton({ invoiceId, amount, email }: { invoiceId: string, amount: number, email: string }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, amount, email }),
      });
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      if (!data.url) throw new Error("Could not reach Paystack. Please try again.");
      
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Payment initialization failed. Please check your internet connection.');
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment} 
      disabled={loading}
      className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-black py-4 rounded-2xl uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-500/20 active:scale-95 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Pay Now via Paystack <ArrowRight className="w-4 h-4" /></>}
    </button>
  );
}