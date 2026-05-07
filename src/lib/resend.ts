import { Resend } from 'resend';

// This facilitates the transactional email logic for arrival notifications.
export const resend = new Resend(process.env.RESEND_API_KEY);