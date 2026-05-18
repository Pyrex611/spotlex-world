import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { Printer } from 'lucide-react';

export default async function InvoicePrintView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, properties(address_text), profiles(full_name, phone)')
    .eq('id', id)
    .single();

  if (!invoice || (invoice.client_id !== user.id && user.user_metadata?.role !== 'admin')) {
    redirect('/client/billing');
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto bg-white p-12 md:p-16 shadow-2xl print:shadow-none print:p-0">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
          <div>
            <BrandLogo iconSize={40} textSize="text-2xl" />
            <div className="mt-4 space-y-1 text-sm font-medium text-slate-600">
              <p>1 Da Gowon du Way, Fwavwie, Rayfield, Jos.</p>
              <p>Tel: 08037002250, 08036459769</p>
              <p>Email: spotlexworld@gmail.com</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">INVOICE</h1>
            <p className="text-slate-500 font-mono mt-2 font-bold">SPLX-{invoice.id.split('-')[0].toUpperCase()}</p>
            <p className="text-sm font-bold text-slate-900 mt-4 uppercase px-3 py-1 bg-slate-100 rounded inline-block">
              Status: {invoice.status}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-start mb-12">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billed To</p>
            <h2 className="text-xl font-black text-slate-900">{(invoice.profiles as any)?.full_name}</h2>
            <p className="text-sm font-medium text-slate-600 max-w-xs">{(invoice.properties as any)?.address_text}</p>
            <p className="text-sm font-medium text-slate-600">Tel: {(invoice.profiles as any)?.phone}</p>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Month</p>
            <p className="text-lg font-bold text-slate-900">{new Date(invoice.month_year + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Due Date</p>
            <p className="text-sm font-bold text-slate-900">{new Date(invoice.due_date).toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <table className="w-full text-left mb-12 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
              <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Amount (NGN)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(invoice.breakdown as any[]).length > 0 ? (
              (invoice.breakdown as any[]).map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-4 text-sm font-bold text-slate-700">{item.description} <span className="text-xs font-normal text-slate-400">({item.unit} x {item.rate})</span></td>
                  <td className="py-4 text-sm font-mono font-bold text-slate-900 text-right">{Number(item.sum).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 text-sm font-bold text-slate-700">Standard Waste Evacuation - {new Date(invoice.month_year + '-01').toLocaleDateString('en-GB', { month: 'long' })}</td>
                <td className="py-4 text-sm font-mono font-bold text-slate-900 text-right">{Number(invoice.current_charge).toLocaleString()}</td>
              </tr>
            )}
            
            <tr>
              <td className="py-4 text-sm font-bold text-slate-700">Net Arrears (Outstanding)</td>
              <td className="py-4 text-sm font-mono font-bold text-slate-900 text-right">{Number(invoice.net_arrears).toLocaleString()}</td>
            </tr>
            {Number(invoice.vat_amount) > 0 && (
              <tr>
                <td className="py-4 text-sm font-bold text-slate-700">Value Added Tax (VAT)</td>
                <td className="py-4 text-sm font-mono font-bold text-slate-900 text-right">{Number(invoice.vat_amount).toLocaleString()}</td>
              </tr>
            )}
            {Number(invoice.advance_payment) > 0 && (
              <tr>
                <td className="py-4 text-sm font-bold text-green-600">Advance / Partial Payment Applied</td>
                <td className="py-4 text-sm font-mono font-bold text-green-600 text-right">-{Number(invoice.advance_payment).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-4 border-slate-900 bg-slate-50">
              <td className="py-6 px-4 text-sm font-black text-slate-900 uppercase tracking-widest">Total Amount Due</td>
              <td className="py-6 px-4 text-2xl font-mono font-black text-slate-900 text-right">₦{Number(invoice.total_due).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div className="border-t border-slate-200 pt-8 flex justify-between items-end text-xs font-medium text-slate-500">
          <div>
            <p className="font-bold text-slate-900 mb-1">Payment Instructions:</p>
            <p>Payable via Paystack securely on your SpotlexWorld Dashboard.</p>
            <p>For Manual Transfer: Sterling Bank, 0067170110, Spotlex World.</p>
          </div>
          <div className="text-right">
            <p>Printed: {new Date().toLocaleDateString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="mt-12 flex justify-center print:hidden">
          <button onClick={() => window.print()} className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg">
            <Printer className="w-4 h-4" /> Print Document
          </button>
        </div>
      </div>
    </div>
  );
}