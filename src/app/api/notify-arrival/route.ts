import { resend } from '@/lib/resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, clientName, address } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'SpotlexWorld <onboarding@resend.dev>', // Replace with your verified domain in production
      to: [email],
      subject: '🚛 SpotlexWorld: We are at your gate!',
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
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} SpotlexWorld. All rights reserved.
          </div>
        </div>
      `
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}