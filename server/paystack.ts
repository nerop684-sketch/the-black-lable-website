import crypto from 'node:crypto';

export function isPaystackConfigured(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY || '';
  return key.startsWith('sk_') && key.length > 10;
}

export interface PaystackInitParams {
  email: string;
  amountUsd: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResult {
  configured: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  message?: string;
}

export async function initializePaystackTransaction(
  params: PaystackInitParams,
): Promise<PaystackInitResult> {
  if (!isPaystackConfigured()) {
    return {
      configured: false,
      reference: params.reference,
      message:
        'Paystack secret key (PAYSTACK_SECRET_KEY) is not configured on the server. Order has been recorded as Pending Payment.',
    };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY!;
  // Paystack expects amount in minor currency units (e.g. kobo/cents)
  const amountInMinorUnits = Math.round(params.amountUsd * 100);

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: amountInMinorUnits,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {},
    }),
  });

  const data = (await response.json()) as {
    status: boolean;
    message?: string;
    data?: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  };

  if (!response.ok || !data.status || !data.data) {
    throw new Error(data.message || 'Unable to initialize Paystack transaction.');
  }

  return {
    configured: true,
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

export async function verifyPaystackTransaction(reference: string): Promise<{
  configured: boolean;
  verified: boolean;
  gatewayStatus: string;
  amountMinor: number;
  message: string;
}> {
  if (!isPaystackConfigured()) {
    return {
      configured: false,
      verified: false,
      gatewayStatus: 'unconfigured',
      amountMinor: 0,
      message: 'Paystack secret key is not configured on the server.',
    };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY!;
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    },
  );

  const payload = (await response.json()) as {
    status: boolean;
    message?: string;
    data?: {
      status: string;
      amount: number;
      reference: string;
    };
  };

  if (!response.ok || !payload.status || !payload.data) {
    return {
      configured: true,
      verified: false,
      gatewayStatus: 'error',
      amountMinor: 0,
      message: payload.message || 'Paystack verification failed.',
    };
  }

  return {
    configured: true,
    verified: payload.data.status === 'success',
    gatewayStatus: payload.data.status,
    amountMinor: payload.data.amount,
    message:
      payload.data.status === 'success'
        ? 'Payment verified via Paystack.'
        : `Paystack transaction status: ${payload.data.status}`,
  };
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | undefined,
): boolean {
  if (!isPaystackConfigured() || !signature) return false;
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest('hex');
  const hashBuf = Buffer.from(hash, 'utf8');
  const sigBuf = Buffer.from(signature, 'utf8');
  if (hashBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, sigBuf);
}
