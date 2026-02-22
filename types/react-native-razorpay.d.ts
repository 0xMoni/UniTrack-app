declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    prefill?: { email?: string; contact?: string; name?: string };
    theme?: { color?: string };
  }

  interface RazorpayCheckout {
    open(options: RazorpayOptions): Promise<{
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }>;
  }

  const RazorpayCheckout: RazorpayCheckout;
  export default RazorpayCheckout;
}
