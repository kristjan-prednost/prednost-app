import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function NapredekAdmin({ showToast }) {
  const [kategorije, setKategorije] = useState([])
  const [kandidati, setKandidati] = useState([])
  const [filtrirani, setFiltrirani] = useState([])
  const [iskanje, setIskanje] = useState('')
  const [izbranKandidat, setIzbranKandidat] = useState(null)
  const [napredek, setNapredek] = useState({})
  const [odprti, setOdprti] = useState({})

  useEffect(() => { loadOsnovno() }, [])

  async function loadOsnovno() {
    const { data: kat } = await supabase
      .from('checklist_kategorije')
      .select('*, checklist_postavke(*)')
      .order('vrstni_red')
      .order('vrstni_red', { referencedTable: 'checklist_postavke' })

    const { data: kand } = await supabase
      .from('profili')
      .select('*')
      .eq('vloga', 'kandidat')
      .order('priimek')

    setKategorije(kat || [])
    setKandidati(kand || [])
    setFiltrirani(kand || [])
  }

  async function izberiKandidata(kandidat) {
    setIzbranKandidat(kandidat)
    setIskanje(`${kandidat.ime} ${kandidat.priimek}`)
    setFiltrirani([])

    const { data: nap } = await supabase
      .from('napredek')
      .select('*')
      .eq('kandidat_id', kandidat.id)

    const napMap = {}
    nap?.forEach(n => { napMap[n.postavka_id] = n })
    setNapredek(napMap)

    if (kategorije.length) setOdprti({ [kategorije[0].id]: true })
  }

  function handleIskanje(val) {
    setIskanje(val)
    setIzbranKandidat(null)
    if (!val.trim()) {
      setFiltrirani([])
      return
    }
    const q = val.toLowerCase()
    setFiltrirani(kandidati.filter(k =>
      `${k.ime} ${k.priimek}`.toLowerCase().includes(q) ||
      k.email.toLowerCase().includes(q)
    ))
  }

  function getStatus(postavkaId) {
    const n = napredek[postavkaId]
    if (!n) return 'nenauceno'
    if (n.nauceno) return 'nauceno'
    if (n.veca_vaja) return 'veca_vaja'
    return 'nenauceno'
  }

  async function toggleAdmin(postavkaId) {
    if (!izbranKandidat) return
    const status = getStatus(postavkaId)

    let noviStatus
    if (status === 'nenauceno') noviStatus = 'nauceno'
    else if (status === 'nauceno') noviStatus = 'veca_vaja'
    else noviStatus = 'nenauceno'

    if (noviStatus === 'nenauceno') {
      await supabase.from('napredek').delete()
        .eq('kandidat_id', izbranKandidat.id)
        .eq('postavka_id', postavkaId)
      const novi = { ...napredek }
      delete novi[postavkaId]
      setNapredek(novi)
    } else {
      const data = {
        kandidat_id: izbranKandidat.id,
        postavka_id: postavkaId,
        nauceno: noviStatus === 'nauceno',
        veca_vaja: noviStatus === 'veca_vaja',
        datum_nauceno: noviStatus === 'nauceno' ? new Date().toISOString() : null
      }
      await supabase.from('napredek').upsert(data, { onConflict: 'kandidat_id,postavka_id' })
      setNapredek(prev => ({ ...prev, [postavkaId]: data }))
    }
    showToast('Napredek posodobljen.')
  }

  const skupajPostavk = kategorije.reduce((sum, k) => sum + (k.checklist_postavke?.length || 0), 0)
  const naucenih = Object.values(napredek).filter(n => n.nauceno).length
  const odstotek = skupajPostavk > 0 ? Math.round((naucenih / skupajPostavk) * 100) : 0

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.1 }}>
          Napredek <span style={{ color: 'var(--accent-bright)' }}>kandidatov</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Mono', marginTop: 10 }}>
          Išči kandidata in označi napredek.
        </p>
      </div>

      {/* SEARCH */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input
          value={iskanje}
          onChange={e => handleIskanje(e.target.value)}
          placeholder="Išči kandidata po imenu ali emailu..."
          style={{
            width: '100%', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 12,
            padding: '14px 18px', color: 'var(--text)',
            fontFamily: 'DM Mono', fontSize: '0.9rem', outline: 'none'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {filtrirani.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, marginTop: 4, zIndex: 100, overflow: 'hidden'
          }}>
            {filtrirani.map(k => (
              <div key={k.id} onClick={() => izberiKandidata(k)}
                style={{
                  padding: '12px 18px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{k.ime} {k.priimek}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'DM Mono' }}>{k.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NAPREDEK IZBRANEGA KANDIDATA */}
      {izbranKandidat && (
        <>
          {/* Info + progress */}
          <div className="form-box" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {izbranKandidat.ime} {izbranKandidat.priimek}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                  {izbranKandidat.email}
                </div>
              </div>
              <span style={{
                fontFamily: 'DM Mono', fontSize: '1.1rem',
                color: odstotek === 100 ? 'var(--success)' : 'var(--accent-bright)', fontWeight: 700
              }}>
                {odstotek}%
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4 }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: odstotek === 100 ? 'var(--success)' : 'var(--accent)',
                width: `${odstotek}%`, transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
              {naucenih}/{skupajPostavk} naučenih postavk
            </div>

            {/* Legenda */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Nenaučeno', bg: 'rgba(239,68,68,0.3)', border: 'var(--danger)' },
                { label: 'Potrebuje več vaje', bg: 'rgba(245,158,11,0.3)', border: 'var(--accent2)' },
                { label: 'Naučeno', bg: 'rgba(34,211,238,0.3)', border: 'var(--success)' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: l.bg, border: `2px solid ${l.border}` }} />
                  {l.label}
                </div>
              ))}
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
                    <span style={{ fontSize: '0.7rem', fontFamily: 'DM Mono', color: katOdst === 100 ? 'var(--success)' : 'var(--muted)' }}>
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
                        <div key={p.id} onClick={() => toggleAdmin(p.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 20px', cursor: 'pointer',
                            borderBottom: '1px solid rgba(30,45,69,0.4)',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
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
        </>
      )}

      {!izbranKandidat && !iskanje && (
        <div className="empty">Začni iskati kandidata zgoraj. 🔍</div>
      )}
    </div>
  )
}