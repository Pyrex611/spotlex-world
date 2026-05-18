export async function initializePaystackTransaction(email: string, amount: number, reference: string, callbackUrl: string) {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  
  if (!PAYSTACK_SECRET) {
    throw new Error("Paystack secret key is missing in environment variables.");
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: callbackUrl,
    }),
  });

  const data = await response.json();
  
  if (!data.status) {
    throw new Error(data.message || "Failed to initialize Paystack transaction");
  }

  return data.data;
}