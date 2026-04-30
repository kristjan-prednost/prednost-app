import * as jose from 'https://deno.land/x/jose@v4.15.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function generateVapidHeaders(endpoint: string, vapidPublic: string, vapidPrivate: string) {
  const audience = new URL(endpoint).origin
  const privateKey = await jose.importPKCS8(
    `-----BEGIN PRIVATE KEY-----\n${vapidPrivate}\n-----END PRIVATE KEY-----`,
    'ES256'
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
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
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
    let subject = ''
    let html = ''

    if (tip === 'prost_termin') {
      title = '📅 Sprostil se je termin vožnje!'
      body = 'Prijavite se na prednost-termini.si in rezervirajte termin.'
      subject = '📅 Sprostil se je termin vožnje – Šola vožnje Prednost'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Sprostil se je termin vožnje!</h2>
          <p>Pozdravljeni,</p>
          <p>obvestiti vas želimo, da se je sprostil termin vožnje.</p>
          <p>Prijavite se čim prej na <a href="https://prednost-termini.si" style="color: #3b82f6;">prednost-termini.si</a> in rezervirajte termin.</p>
          <p>Srečno pri vožnji! 🚗</p>
          <p style="color: #888; font-size: 12px;">Šola vožnje Prednost</p>
        </div>
      `
    } else if (tip === 'opomnik') {
      title = '🚗 Opomnik – jutri imaš termin vožnje!'
      body = `Termin: ${termin_datum} ob ${termin_cas}`
      subject = '🚗 Opomnik – jutri imaš termin vožnje'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Opomnik za termin vožnje</h2>
          <p>Pozdravljeni,</p>
          <p>jutri imaš termin vožnje ob <strong>${termin_cas}</strong>.</p>
          <p>Datum: <strong>${termin_datum}</strong></p>
          <p>Srečno! 🚗</p>
          <p style="color: #888; font-size: 12px;">Šola vožnje Prednost</p>
        </div>
      `
    }

    let pushSent = 0
    let emailSent = 0

    for (const k of kandidati) {
      const sub = subMap.get(k.id)

      if (sub) {
        // Pošlji push notifikacijo
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
/*      } else {
        // Ni subscriptiona — pošlji email
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Šola vožnje Prednost <noreply@prednost-termini.si>',
              to: k.email,
              subject,
              html
            })
          })
          if (res.ok) emailSent++
          else {
            const err = await res.text()
            console.error(`Email napaka za ${k.email}:`, err)
          }
        } catch(e) {
          console.error(`Email exception za ${k.email}:`, e)
        }
      }
    }*/

    console.log(`Push: ${pushSent}, Email: ${emailSent}, tip: ${tip}`)
    return new Response(JSON.stringify({ pushSent, emailSent }), {
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