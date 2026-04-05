import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Napredek({ profil }) {
  const [kategorije, setKategorije] = useState([])
  const [napredek, setNapredek] = useState({})
  const [loading, setLoading] = useState(false)
  const [odprti, setOdprti] = useState({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: kat } = await supabase
      .from('checklist_kategorije')
      .select('*, checklist_postavke(*)')
      .order('vrstni_red')
      .order('vrstni_red', { referencedTable: 'checklist_postavke' })

    const { data: nap } = await supabase
      .from('napredek')
      .select('*')
      .eq('kandidat_id', profil.id)

    const napMap = {}
    nap?.forEach(n => { napMap[n.postavka_id] = n })
    setKategorije(kat || [])
    setNapredek(napMap)

    if (kat?.length) setOdprti({ [kat[0].id]: true })
  }

  function getStatus(postavkaId) {
    const n = napredek[postavkaId]
    if (!n) return 'nenauceno'
    if (n.nauceno) return 'nauceno'
    if (n.veca_vaja) return 'veca_vaja'
    return 'nenauceno'
  }

  async function toggleVaja(postavkaId) {
    const status = getStatus(postavkaId)

    // Kandidat ne more označiti nenaučenega
    if (status === 'nenauceno') return

    const obstoječ = napredek[postavkaId]
    const noviStatus = status === 'nauceno' ? 'veca_vaja' : 'nauceno'

    const data = {
      kandidat_id: profil.id,
      postavka_id: postavkaId,
      nauceno: noviStatus === 'nauceno',
      veca_vaja: noviStatus === 'veca_vaja',
      datum_nauceno: obstoječ?.datum_nauceno || null
    }

    await supabase.from('napredek').upsert(data, { onConflict: 'kandidat_id,postavka_id' })
    setNapredek(prev => ({ ...prev, [postavkaId]: data }))
  }

  const skupajPostavk = kategorije.reduce((sum, k) => sum + (k.checklist_postavke?.length || 0), 0)
  const naucenih = Object.values(napredek).filter(n => n.nauceno).length
  const odstotek = skupajPostavk > 0 ? Math.round((naucenih / skupajPostavk) * 100) : 0

  if (loading) return <div className="page"><div className="empty">Nalaganje...</div></div>

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.1 }}>
          Moj <span style={{ color: 'var(--accent-bright)' }}>napredek</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Mono', marginTop: 10 }}>
          Označi kaj potrebuješ še vaditi — inštruktor vidi tvoj napredek.
        </p>
      </div>

      {/* Napredek bar */}
      <div className="form-box" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: 'DM Mono', fontSize: '0.82rem', color: 'var(--muted)' }}>
            Skupni napredek
          </span>
          <span style={{ fontFamily: 'DM Mono', fontSize: '0.88rem', color: 'var(--accent-bright)', fontWeight: 700 }}>
            {naucenih}/{skupajPostavk} · {odstotek}%
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4 }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: odstotek === 100 ? 'var(--success)' : 'var(--accent)',
            width: `${odstotek}%`, transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: 'DM Mono', color: 'var(--muted)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(239,68,68,0.3)', border: '2px solid var(--danger)' }} />
            Nenaučeno
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: 'DM Mono', color: 'var(--muted)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(245,158,11,0.3)', border: '2px solid var(--accent2)' }} />
            Potrebujem več vaje
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: 'DM Mono', color: 'var(--muted)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(34,211,238,0.3)', border: '2px solid var(--success)' }} />
            Naučeno
          </div>
        </div>
      </div>

      {/* Kategorije */}
      {kategorije.map(kat => {
        const jeOdprt = odprti[kat.id]
        const postavke = kat.checklist_postavke || []
        const katNaucenih = postavke.filter(p => getStatus(p.id) === 'nauceno').length
        const katOdst = postavke.length > 0 ? Math.round((katNaucenih / postavke.length) * 100) : 0

        return (
          <div key={kat.id} className="form-box" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
            <div onClick={() => setOdprti(o => ({ ...o, [kat.id]: !o[kat.id] }))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', cursor: 'pointer',
                borderBottom: jeOdprt ? '1px solid var(--border)' : 'none'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{kat.naziv}</span>
                <span style={{
                  fontSize: '0.7rem', fontFamily: 'DM Mono',
                  color: katOdst === 100 ? 'var(--success)' : 'var(--muted)'
                }}>
                  {katNaucenih}/{postavke.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 60, height: 4, background: 'var(--surface2)', borderRadius: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: katOdst === 100 ? 'var(--success)' : 'var(--accent)',
                    width: `${katOdst}%`
                  }} />
                </div>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{jeOdprt ? '▲' : '▼'}</span>
              </div>
            </div>

            {jeOdprt && (
              <div style={{ padding: '8px 0' }}>
                {postavke.map(p => {
                  const status = getStatus(p.id)
                  const barva = status === 'nauceno' ? 'var(--success)' :
                                status === 'veca_vaja' ? 'var(--accent2)' : 'var(--danger)'
                  const bg = status === 'nauceno' ? 'rgba(34,211,238,0.15)' :
                             status === 'veca_vaja' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'
                  const znak = status === 'nauceno' ? '✓' : status === 'veca_vaja' ? '!' : '✗'

                  return (
                    <div key={p.id}
                      onClick={() => toggleVaja(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 20px',
                        cursor: status === 'nenauceno' ? 'default' : 'pointer',
                        borderBottom: '1px solid rgba(30,45,69,0.4)',
                        transition: 'background 0.15s',
                        opacity: status === 'nenauceno' ? 0.6 : 1
                      }}
                      onMouseEnter={e => { if (status !== 'nenauceno') e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: bg, border: `2px solid ${barva}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: barva
                      }}>
                        {znak}
                      </div>
                      <span style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>{p.naziv}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}