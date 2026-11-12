const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal Client ID or Secret not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get PayPal access token (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function createPayPalOrder(
  milestoneId: string,
  amount: number,
  currency: string = "USD"
): Promise<{ id: string; status: string }> {
  const token = await getPayPalAccessToken();

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: milestoneId,
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        description: `MilestoneGuard Milestone Payment [Ref: ${milestoneId}]`,
      },
    ],
  };

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create PayPal order (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return { id: data.id, status: data.status };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  captureId?: string;
  referenceId?: string;
}> {
  const token = await getPayPalAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to capture PayPal order (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const captureUnit = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    id: data.id,
    status: data.status,
    captureId: captureUnit?.id,
    referenceId: data.purchase_units?.[0]?.reference_id,
  };
}

export async function createPayPalPayout(
  recipientEmail: string,
  amount: number,
  currency: string = "USD",
  note: string = "Milestone payout"
): Promise<{ batchId: string; status: string }> {
  const token = await getPayPalAccessToken();
  const batchId = `MG_PAYOUT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const payload = {
    sender_batch_header: {
      sender_batch_id: batchId,
      email_subject: "You received a milestone payout from MilestoneGuard AI",
      email_message: note,
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amount.toFixed(2),
          currency,
        },
        note,
        sender_item_id: `ITEM_${Date.now()}`,
        receiver: recipientEmail,
      },
    ],
  };

  const res = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to execute PayPal payout (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    batchId: data.batch_header?.payout_batch_id || batchId,
    status: data.batch_header?.batch_status || "PENDING",
  };
}

export async function verifyPayPalWebhookSignature(
  headers: Record<string, string>,
  body: any,
  webhookId: string
): Promise<boolean> {
  const token = await getPayPalAccessToken();

  const payload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: webhookId,
    webhook_event: body,
  };

  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
