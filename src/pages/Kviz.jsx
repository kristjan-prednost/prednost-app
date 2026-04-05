import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Kviz({ showToast }) {
  const [vprasanja, setVprasanja] = useState([])
  const [trenutno, setTrenutno] = useState(0)
  const [izbrani, setIzbrani] = useState(null)
  const [odgovori, setOdgovori] = useState([]) // { vprasanjeId, izbran, pravilen, pravilenIndex }
  const [faza, setFaza] = useState('zacetek') // 'zacetek' | 'kviz' | 'rezultat'
  const [loading, setLoading] = useState(false)

  async function zacniKviz() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vprasanja')
      .select('*')

    if (error || !data?.length) {
      showToast('Ni vprašanj v bazi. Kontaktiraj inštruktorja.', 'error')
      setLoading(false)
      return
    }

    // Naključnih 10
    const premešana = [...data].sort(() => Math.random() - 0.5).slice(0, Math.min(10, data.length))
    setVprasanja(premešana)
    setTrenutno(0)
    setIzbrani(null)
    setOdgovori([])
    setFaza('kviz')
    setLoading(false)
  }

  function izberiOdgovor(index) {
    if (izbrani !== null) return // ne dovoli spremembe
    setIzbrani(index)
  }

  function naslednje() {
    if (izbrani === null) return
    const vpr = vprasanja[trenutno]
    const pravilenIndex = vpr.pravilen_odgovor

    setOdgovori(prev => [...prev, {
      vprasanjeId: vpr.id,
      vprasanje: vpr.vprasanje,
      moznosti: vpr.moznosti,
      izbran: izbrani,
      pravilen: izbrani === pravilenIndex,
      pravilenIndex
    }])

    if (trenutno + 1 >= vprasanja.length) {
      setFaza('rezultat')
    } else {
      setTrenutno(t => t + 1)
      setIzbrani(null)
    }
  }

  function ponoviKviz() {
    setFaza('zacetek')
    setVprasanja([])
    setOdgovori([])
    setTrenutno(0)
    setIzbrani(null)
  }

  const tocno = odgovori.filter(o => o.pravilen).length

  // ZAČETEK
  if (faza === 'zacetek') return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.1 }}>
          Vadite za <span style={{ color: 'var(--accent-bright)' }}>izpitna vprašanja</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Mono', marginTop: 10 }}>
          Kviz vsebuje 10 naključnih vprašanj iz nabora izpitnih vprašanj.
        </p>
      </div>

      <div className="form-box" style={{ textAlign: 'center', padding: '40px 28px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚗</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 500, marginBottom: 10 }}>Pripravljen?</h2>
        <p style={{ color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: '0.82rem', marginBottom: 28, lineHeight: 1.7 }}>
          Vsakič dobiš 10 naključnih vprašanj.<br />
          Za vsako vprašanje izberi en pravilen odgovor.<br />
          Na koncu vidiš rezultat in pregled napak.
        </p>
        <button className="btn-primary" onClick={zacniKviz} disabled={loading}>
          {loading ? 'Nalaganje...' : '▶ Začni kviz'}
        </button>
      </div>
    </div>
  )

  // KVIZ
  if (faza === 'kviz') {
    const vpr = vprasanja[trenutno]
    const moznosti = vpr.moznosti || []
    const napredek = ((trenutno) / vprasanja.length) * 100

    return (
      <div className="page">
        {/* Napredek */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'DM Mono', fontSize: '0.78rem', color: 'var(--muted)' }}>
              Vprašanje {trenutno + 1} / {vprasanja.length}
            </span>
            <span style={{ fontFamily: 'DM Mono', fontSize: '0.78rem', color: 'var(--accent-bright)' }}>
              {odgovori.filter(o => o.pravilen).length} točno
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 4 }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: 'var(--accent)',
              width: `${napredek}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Vprašanje */}
        <div className="form-box" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, marginBottom: 16 }}>
            {vpr.vprasanje}
          </p>
          {vpr.slika_url && (
            <img src={vpr.slika_url} alt="Slika"
              style={{ width: '100%', maxWidth: 280, borderRadius: 10, display: 'block', margin: '0 auto' }}
            />
          )}
        </div>

        {/* Odgovori */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {moznosti.map((m, i) => {
            let bg = 'var(--surface2)'
            let border = 'var(--border)'
            let color = 'var(--text)'

            if (izbrani !== null) {
              if (i === vpr.pravilen_odgovor) {
                bg = 'rgba(34,211,238,0.1)'; border = 'var(--success)'; color = 'var(--success)'
              } else if (i === izbrani) {
                bg = 'rgba(239,68,68,0.1)'; border = 'var(--danger)'; color = 'var(--danger)'
              }
            } else if (izbrani === null) {
              // hover efekt
            }

            return (
              <div key={i} onClick={() => izberiOdgovor(i)} style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 10, padding: '14px 18px',
                cursor: izbrani !== null ? 'default' : 'pointer',
                color, fontFamily: 'DM Mono', fontSize: '0.88rem',
                lineHeight: 1.5, transition: 'all 0.15s',
                display: 'flex', alignItems: 'flex-start', gap: 12
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: `2px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 500, flexShrink: 0,
                  background: izbrani !== null && i === vpr.pravilen_odgovor ? 'var(--success)' :
                    izbrani === i ? 'var(--danger)' : 'transparent',
                  color: (izbrani !== null && (i === vpr.pravilen_odgovor || i === izbrani)) ? '#fff' : color
                }}>
                  {izbrani !== null && i === vpr.pravilen_odgovor ? '✓' :
                    izbrani === i && i !== vpr.pravilen_odgovor ? '✗' :
                      String.fromCharCode(65 + i)}
                </span>
                {m}
              </div>
            )
          })}
        </div>

        <button className="btn-primary" disabled={izbrani === null} onClick={naslednje}>
          {trenutno + 1 >= vprasanja.length ? 'Zaključi kviz' : 'Naslednje vprašanje →'}
        </button>
      </div>
    )
  }

  // REZULTAT
  if (faza === 'rezultat') {
    const odstotek = Math.round((tocno / vprasanja.length) * 100)
    const barva = odstotek >= 70 ? 'var(--success)' : odstotek >= 50 ? 'var(--accent2)' : 'var(--danger)'
    const emoji = odstotek >= 70 ? '🎉' : odstotek >= 50 ? '👍' : '💪'
    const sporocilo = odstotek >= 70 ? 'Odlično! Dobro si pripravljen.' : odstotek >= 50 ? 'Kar dobro! Še malo vaje.' : 'Potrebuješ še vaje. Ne obupaj!'

    return (
      <div className="page">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>{emoji}</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 8 }}>
            Rezultat: <span style={{ color: barva }}>{tocno}/{vprasanja.length}</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: '0.85rem' }}>
            {sporocilo}
          </p>

          {/* Krog z odstotkom */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            border: `4px solid ${barva}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '20px auto',
            background: `${barva}15`
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: barva }}>{odstotek}%</span>
          </div>
        </div>

        {/* Pregled odgovorov */}
        <div className="form-box" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>PREGLED ODGOVOROV</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {odgovori.map((o, i) => (
              <div key={i} style={{
                background: o.pravilen ? 'rgba(34,211,238,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${o.pravilen ? 'rgba(34,211,238,0.3)' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: 10, padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: '1rem' }}>{o.pravilen ? '✅' : '❌'}</span>
                  <p style={{ fontFamily: 'DM Mono', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                    {i + 1}. {o.vprasanje}
                  </p>
                </div>
                <div style={{ marginLeft: 28 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontFamily: 'DM Mono', marginBottom: 2 }}>
                    ✓ Pravilen: {o.moznosti[o.pravilenIndex]}
                  </div>
                  {!o.pravilen && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontFamily: 'DM Mono' }}>
                      ✗ Tvoj odgovor: {o.moznosti[o.izbran]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={ponoviKviz}>
          🔄 Ponovi kviz
        </button>
      </div>
    )
  }
}