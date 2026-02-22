import { API_BASE_URL } from './config';
import { FetchResponse } from './types';

export async function fetchAttendanceFromApi(
  erpUrl: string,
  username: string,
  password: string,
  threshold: number
): Promise<FetchResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erpUrl, username, password, threshold }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out — the ERP server took too long to respond. Try again.' };
    }
    return { success: false, error: err instanceof Error ? err.message : 'Network error — check your connection' };
  }
}

export async function parseTimetableFromApi(
  imageBase64: string,
  mimeType: string,
  subjectCodes: string[]
): Promise<{ success: boolean; timetable?: Record<number, string[]>; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/parse-timetable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, mimeType, subjectCodes }),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Network error — could not reach the server' };
  }
}

export async function createPaymentOrder(
  uid: string,
  email: string
): Promise<{ ok: boolean; keyId?: string; amount?: number; currency?: string; orderId?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email }),
    });
    const data = await response.json();
    if (!response.ok) return { ok: false, error: data.error || 'Failed to create order' };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function verifyPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  uid: string,
  currentPremiumUntil: string | null
): Promise<{ ok: boolean; premiumUntil?: string; payment?: unknown; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        uid,
        currentPremiumUntil,
      }),
    });
    const data = await response.json();
    if (!response.ok) return { ok: false, error: data.error || 'Verification failed' };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
