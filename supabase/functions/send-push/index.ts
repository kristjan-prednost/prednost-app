const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    let subject = ''
    let html = ''

    if (tip === 'prost_termin') {
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

    let sent = 0
    for (const k of kandidati) {
      try {
        // Delay da se izognemo rate limitu
        if (sent > 0) await new Promise(r => setTimeout(r, 500))
        
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
        if (res.ok) sent++
        else {
          const err = await res.text()
          console.error(`Email napaka za ${k.email}:`, err)
        }
      } catch(e) {
        console.error(`Email exception za ${k.email}:`, e)
      }
    }

    console.log(`Poslano ${sent}/${kandidati.length} emailov, tip: ${tip}`)
    return new Response(JSON.stringify({ sent }), {
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