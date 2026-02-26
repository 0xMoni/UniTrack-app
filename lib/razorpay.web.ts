import { RAZORPAY_KEY_ID } from './config';

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: {
  orderId: string;
  amount: number;
  currency: string;
  email: string;
}): Promise<RazorpaySuccessResponse> {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: options.amount,
      currency: options.currency,
      name: 'UniTrack',
      description: 'Premium — 30 days',
      order_id: options.orderId,
      prefill: { email: options.email },
      theme: { color: '#6366f1' },
      handler: (response: RazorpaySuccessResponse) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment was cancelled'));
        },
      },
    });
    rzp.open();
  });
}
