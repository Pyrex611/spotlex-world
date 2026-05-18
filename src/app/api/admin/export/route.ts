import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  const { data: { user } } = await supabase.auth.getUser();
  const { data: admin } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  if (admin?.role !== 'admin') return new NextResponse('Unauthorized', { status: 401 });

  const { data: clients } = await supabase
    .from('profiles')
    .select(`
      id, full_name, phone,
      invoices ( total_due, status )
    `)
    .eq('role', 'client');

  if (!clients) return new NextResponse('No data', { status: 404 });

  let csvContent = 'Name,Phone,Total_Owed_NGN\n';
  
  clients.forEach(client => {
    const unpaidInvoices = (client.invoices as any[])?.filter(inv => inv.status === 'unpaid' || inv.status === 'partial') || [];
    const totalOwed = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_due), 0);

    if (totalOwed > 0 && client.phone) {
      let phone = client.phone.replace(/\D/g, '');
      if (type === 'whatsapp' && phone.startsWith('0')) phone = '234' + phone.substring(1);
      csvContent += `"${client.full_name}","${phone}","${totalOwed}"\n`;
    }
  });

  const fileName = `SpotlexWorld_${type === 'whatsapp' ? 'WhatsApp' : 'SMS'}_Data_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}