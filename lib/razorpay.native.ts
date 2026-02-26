import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from './config';

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function openRazorpayCheckout(options: {
  orderId: string;
  amount: number;
  currency: string;
  email: string;
}): Promise<RazorpaySuccessResponse> {
  const result = await RazorpayCheckout.open({
    key: RAZORPAY_KEY_ID,
    amount: options.amount,
    currency: options.currency,
    name: 'UniTrack',
    description: 'Premium — 30 days',
    order_id: options.orderId,
    prefill: { email: options.email },
    theme: { color: '#6366f1' },
  });
  return result as RazorpaySuccessResponse;
}
