import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { CreditCard, FileText, CheckCircle2, AlertCircle, Building2, Printer, ArrowLeft } from 'lucide-react';
import PaystackCheckoutButton from '@/components/client/PaystackCheckoutButton';
import Link from 'next/link';

export default async function ClientBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, properties(address_text)')
    .eq('client_id', user.id)
    .order('due_date', { ascending: false });

  const totalArrears = invoices?.filter(inv => inv.status !== 'paid').reduce((acc, curr) => acc + Number(curr.total_due), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 px-4 md:px-0 pb-10">
      <div className="flex items-center gap-6 py-6 border-b border-slate-100">
        <Link href="/client/dashboard" className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-900 hover:text-white transition-all text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex justify-between items-center w-full">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing & Payments</h1>
          <BrandLogo iconSize={24} textSize="text-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {(!invoices || invoices.length === 0) ? (
            <div className="bg-slate-50 p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Billing Records Found</p>
            </div>
          ) : (
            invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${invoice.status === 'paid' ? 'bg-green-500' : invoice.status === 'partial' ? 'bg-orange-400' : 'bg-red-500'}`} />
                
                <div className="space-y-4 pl-4 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-md">
                      Bill Ref: SPLX-{invoice.id.split('-')[0].toUpperCase()}
                    </span>
                    <Link href={`/client/billing/${invoice.id}`} className="text-[10px] flex items-center gap-1 font-bold text-slate-600 hover:text-green-600 bg-slate-50 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200">
                      <Printer className="w-3 h-3" /> View Receipt
                    </Link>
                  </div>
                  
                  <div>
                    <p className="text-xl font-black text-slate-900">{new Date(invoice.month_year + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} Bill</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Current Charge</p>
                      <p className="text-sm font-mono font-bold text-slate-700">₦{Number(invoice.current_charge).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Net Arrears</p>
                      <p className="text-sm font-mono font-bold text-slate-700">₦{Number(invoice.net_arrears).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">VAT / Tax</p>
                      <p className="text-sm font-mono font-bold text-slate-700">₦{Number(invoice.vat_amount).toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                      <p className="text-[9px] font-bold text-green-600 uppercase">Total Due</p>
                      <p className="text-sm font-mono font-bold text-green-700">₦{Number(invoice.total_due).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {invoice.status !== 'paid' && profile && (
                  <div className="flex flex-col justify-center items-center md:items-end w-full md:w-auto md:min-w-[150px] pl-4">
                    <PaystackCheckoutButton invoiceId={invoice.id} amount={Number(invoice.total_due)} email={profile.email} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="space-y-6 sticky top-24">
          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl shadow-slate-900/40 text-white">
            <CreditCard className="w-8 h-8 text-green-400 mb-6" />
            <h2 className="text-xl font-bold tracking-tight mb-2">Account Summary</h2>
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Outstanding</span>
              <span className="text-xl font-mono font-black text-red-400">₦{totalArrears.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-slate-500 italic leading-relaxed">
              Ensure you settle your bills to avoid service disruption or legal notices from the Ministry of Environment.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
            <Building2 className="w-8 h-8 text-slate-400 mb-4" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Manual Bank Transfer</h2>
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm">
              <p className="font-medium text-slate-500">Pay all dues to <strong className="text-slate-900">Sterling Bank Plc</strong></p>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Name</p>
                <p className="font-bold text-slate-900">SPOTLEX WORLD ENVIRONMENTAL SOLUTION</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account No.</p>
                <p className="font-mono font-black text-slate-900 text-lg tracking-widest">0067170110</p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-4 text-center">Please send receipt to <a href="mailto:spotlexworld@gmail.com" className="text-green-600">spotlexworld@gmail.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}