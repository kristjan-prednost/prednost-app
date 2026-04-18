const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tip } = await req.json()

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Pridobi vse subscriptions
    const rezRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    })
    const subscriptions = await rezRes.json()

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let title = '📅 Nov prost termin!'
    let body = 'Sprostil se je termin vožnje. Prijavi se na prednost-termini.si'

    if (tip === 'opomnik') {
      title = '🚗 Opomnik – vožnja jutri!'
      body = 'Jutri imaš termin vožnje v Šoli vožnje Prednost.'
    }

    console.log(`Pošiljam ${subscriptions.length} notifikacij, tip: ${tip}`)

    let sent = 0
    for (const sub of subscriptions) {
      try {
        const subscription = sub.subscription
        const payload = JSON.stringify({ title, body, url: 'https://prednost-termini.si' })

        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'TTL': '86400',
          },
          body: payload
        })
        console.log(`Push response: ${response.status}`)
        if (response.ok) sent++
      } catch(e) {
        console.error('Napaka:', e)
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch(e) {
    console.error('Glavna napaka:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})