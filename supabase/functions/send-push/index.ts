import * as jose from 'https://deno.land/x/jose@v4.15.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function generateVapidHeaders(endpoint: string, vapidPublic: string, vapidPrivate: string) {
  const audience = new URL(endpoint).origin

  // Pretvori raw base64url private key
  const rawPrivate = Uint8Array.from(
    atob(vapidPrivate.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  )

  // Pretvori raw base64url public key  
  const rawPublic = Uint8Array.from(
    atob(vapidPublic.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  )

  // Uvozi kot JWK
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      x: btoa(String.fromCharCode(...rawPublic.slice(1, 33))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
      y: btoa(String.fromCharCode(...rawPublic.slice(33))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
      d: vapidPrivate,
      key_ops: ['sign'],
      ext: true,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
    .setAudience(audience)
    .setSubject('mailto:noreply@prednost-termini.si')
    .setExpirationTime('12h')
    .setIssuedAt()
    .sign(privateKey)

  return {
    'Authorization': `vapid t=${jwt}, k=${vapidPublic}`,
    'Content-Type': 'application/octet-stream',
    'TTL': '86400',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tip, kandidat_id, termin_datum, termin_cas } = await req.json()

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!

    const filter = kandidat_id
      ? `vloga=eq.kandidat&id=eq.${kandidat_id}`
      : `vloga=eq.kandidat`

    const kandRes = await fetch(`${SUPABASE_URL}/rest/v1/profili?${filter}&select=id,email,ime,priimek`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    })
    const kandidati = await kandRes.json()

    if (!kandidati || kandidati.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Pridobi push subscriptions
    const subRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    })
    const subscriptions = await subRes.json()
    const subMap = new Map(subscriptions.map((s: any) => [s.kandidat_id, s.subscription]))

    let title = ''
    let body = ''

    if (tip === 'prost_termin') {
      title = '📅 Sprostil se je termin vožnje!'
      body = 'Prijavite se na prednost-termini.si in rezervirajte termin.'
    } else if (tip === 'opomnik') {
      title = '🚗 Opomnik – jutri imaš termin vožnje!'
      body = `Termin: ${termin_datum} ob ${termin_cas}`
    }

    let pushSent = 0

    for (const k of kandidati) {
      const sub = subMap.get(k.id)
      if (!sub) continue

      try {
        const payload = JSON.stringify({ title, body, url: 'https://prednost-termini.si' })
        const headers = await generateVapidHeaders(sub.endpoint, VAPID_PUBLIC, VAPID_PRIVATE)

        const pushRes = await fetch(sub.endpoint, {
          method: 'POST',
          headers,
          body: payload
        })
        console.log(`Push za ${k.email}: ${pushRes.status}`)
        if (pushRes.ok || pushRes.status === 201) pushSent++
        else {
          const err = await pushRes.text()
          console.error(`Push napaka za ${k.email}:`, err)
        }
      } catch(e) {
        console.error(`Push exception za ${k.email}:`, e)
      }
    }

    console.log(`Push: ${pushSent}, tip: ${tip}`)
    return new Response(JSON.stringify({ pushSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch(e) {
    console.error('Glavna napaka:', String(e))
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})