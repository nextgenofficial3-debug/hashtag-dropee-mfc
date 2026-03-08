import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function createJwtForPush(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ token: string; publicKey: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: 'mailto:hashtagdropee@gmail.com',
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Decode the private key
  const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format (64 bytes)
  const sigArray = new Uint8Array(signature);
  let rawSig: Uint8Array;
  
  if (sigArray.length === 64) {
    rawSig = sigArray;
  } else {
    // DER encoded, extract r and s
    const r = sigArray.slice(4, 4 + sigArray[3]);
    const sOffset = 4 + sigArray[3] + 2;
    const s = sigArray.slice(sOffset, sOffset + sigArray[sOffset - 1]);
    rawSig = new Uint8Array(64);
    rawSig.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
    rawSig.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));
  }

  const signatureB64 = btoa(String.fromCharCode(...rawSig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const token = `${unsignedToken}.${signatureB64}`;

  const publicKeyBytes = Uint8Array.from(atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const pubB64 = btoa(String.fromCharCode(...publicKeyBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return { token, publicKey: pubB64 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub as string;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await serviceClient.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders });
    }

    const { title, body, orderId } = await req.json();

    // Get VAPID keys
    const { data: vapidData } = await serviceClient.from('vapid_keys').select('*').limit(1).single();
    if (!vapidData) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all subscriptions
    const { data: subscriptions } = await serviceClient.from('push_subscriptions').select('*');
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ error: 'No subscribers found', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notificationPayload = JSON.stringify({
      title: title || 'MFC Order Update',
      body: body || 'Your order status has been updated!',
      icon: '/icon-512.png',
      badge: '/icon-192.png',
      data: { orderId, url: '/' },
    });

    let sent = 0;
    let failed = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const { token: vapidToken, publicKey } = await createJwtForPush(
          sub.endpoint,
          vapidData.public_key,
          vapidData.private_key
        );

        const payloadBytes = new TextEncoder().encode(notificationPayload);

        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'identity',
            'TTL': '86400',
            'Authorization': `vapid t=${vapidToken},k=${publicKey}`,
          },
          body: payloadBytes,
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 410 || response.status === 404) {
          failedEndpoints.push(sub.endpoint);
          failed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    // Clean up expired subscriptions
    if (failedEndpoints.length > 0) {
      await serviceClient.from('push_subscriptions').delete().in('endpoint', failedEndpoints);
    }

    return new Response(JSON.stringify({ sent, failed, total: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});