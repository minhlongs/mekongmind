/**
 * Polar.sh webhook handler — CF Pages Functions
 * Receives payment events, verifies signature, logs for Phase 2 processing
 */

export async function onRequestGet(context) {
  return new Response('Polar webhook endpoint — POST only', { status: 405 });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const webhookSecret = env.POLAR_WEBHOOK_SECRET;

  // Step 1: Verify Polar signature
  const polarSignature = request.headers.get('Polar-Signature');
  const polarTimestamp = request.headers.get('Polar-Timestamp');

  if (!polarSignature || !polarTimestamp) {
    return new Response(JSON.stringify({ error: 'Missing Polar signature headers' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Step 2: Read body for signature verification
  const body = await request.text();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(webhookSecret);
  const signingData = encoder.encode(polarTimestamp + body);

  let expectedSignature;
  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, signingData);
    expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return new Response(JSON.stringify({ error: 'Signature verification failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Polar sends signatures as "t=timestamp,v1=signature"
  const receivedSig = polarSignature.split(',').find(s => s.startsWith('v1='))?.slice(3);
  if (receivedSig !== expectedSignature) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Step 3: Parse event
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const eventType = event.type;
  const productId = event.data?.product_id || event.data?.product?.id;

  // Step 4: Log event (Phase 2: will write to D1/KV for credit provisioning)
  console.log(`[Polar Webhook] ${eventType} | product: ${productId}`);

  // Step 5: Return 200 OK to Polar
  return new Response(JSON.stringify({ received: true, event: eventType }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
