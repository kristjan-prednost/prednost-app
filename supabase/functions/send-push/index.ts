import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tip, termin_id } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    let query = supabase.from('push_subscriptions').select('*')

    if (tip === 'opomnik' && termin_id) {
      const { data: rez } = await supabase
        .from('rezervacije')
        .select('kandidat_id')
        .eq('termin_id', termin_id)
        .single()
      if (rez) query = query.eq('kandidat_id', rez.kandidat_id)
    }

    const { data: subscriptions } = await query

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let title = ''
    let body = ''
    if (tip === 'opomnik') {
      title = '🚗 Opomnik – vožnja jutri!'
      body = 'Jutri imaš termin vožnje v Šoli vožnje Prednost.'
    } else if (tip === 'prost_termin') {
      title = '📅 Nov prost termin!'
      body = 'Sprostil se je termin vožnje. Prijavi se na prednost-termini.si'
    }

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
        if (response.ok) sent++
      } catch(e) {
        console.error('Napaka pri pošiljanju:', e)
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})