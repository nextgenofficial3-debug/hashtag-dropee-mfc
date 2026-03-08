import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      // Return existing VAPID public key
      const { data } = await supabase
        .from('vapid_keys')
        .select('public_key')
        .limit(1)
        .single();

      if (data) {
        return new Response(JSON.stringify({ publicKey: data.public_key }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate new VAPID keys if none exist
      const keyPair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
      );

      const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyRaw)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      await supabase.from('vapid_keys').insert({
        public_key: publicKeyBase64,
        private_key: privateKeyBase64,
      });

      return new Response(JSON.stringify({ publicKey: publicKeyBase64 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - save subscription
    if (req.method === 'POST') {
      const { subscription } = await req.json();

      if (!subscription?.endpoint) {
        return new Response(JSON.stringify({ error: 'Invalid subscription' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: req.headers.get('user-agent') || '',
      }, { onConflict: 'endpoint' });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});