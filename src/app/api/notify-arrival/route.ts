import { resend } from '@/lib/resend';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { collectionId } = await req.json();

    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Securely fetch the exact client data using the collection ID
    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select(`
        properties (
          address_text,
          profiles ( full_name, email )
        )
      `)
      .eq('id', collectionId)
      .single();

    if (fetchError || !collection) {
      throw new Error('Failed to retrieve client routing data.');
    }

    const clientName = (collection.properties as any).profiles.full_name;
    const clientEmail = (collection.properties as any).profiles.email;
    const address = (collection.properties as any).address_text;

    // Resend Sandbox check for development vs production
    const targetEmail = process.env.NODE_ENV === 'production' && process.env.RESEND_DOMAIN_VERIFIED === 'true' 
      ? clientEmail 
      : (process.env.TEST_DELIVERY_EMAIL || 'delivered@resend.dev');

    const { data, error } = await resend.emails.send({
      from: 'SpotlexWorld <onboarding@resend.dev>', // Update upon domain verification
      to:[targetEmail],
      subject: `🚛 SpotlexWorld: We are at your gate, ${clientName.split(' ')[0]}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #059669; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">SpotlexWorld</h1>
          </div>
          <div style="padding: 40px; color: #0f172a;">
            <h2 style="font-size: 20px; font-weight: 700; margin-top: 0;">Hello ${clientName},</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #475569;">Our collection vehicle has arrived at your residence for the scheduled waste pickup.</p>
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border-left: 4px solid #059669; margin: 32px 0;">
              <p style="margin: 0; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Collection Address</p>
              <p style="margin: 8px 0 0 0; font-size: 15px; font-weight: 600; color: #1e293b;">${address}</p>
            </div>
            <p style="font-size: 14px; color: #64748b;">Please ensure your waste bins are positioned correctly. Our team will wait for a short window before moving to the next location.</p>
          </div>
        </div>
      `
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}