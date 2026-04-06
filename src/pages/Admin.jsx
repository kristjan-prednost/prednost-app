import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTHM_Ntkwpcrn7LkhoavQNLeErkoqtDaqQEZQZ03vJ4Spx1KJe-tItfjkDCw2HbN3C/exec'

function dateStr_(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatDatum(d) {
  const dt = new Date(d + 'T00:00:00')
  const dni = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob']
  const mes = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec']
  return `${dni[dt.getDay()]}, ${dt.getDate()}. ${mes[dt.getMonth()]}`
}
function formatCas(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return d.toLocaleString('sl-SI', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function VprasanjaPanel({ showToast }) {
  const [vprasanja, setVprasanja] = useState([])
  const [forma, setForma] = useState({
    vprasanje: '', slika_url: '',
    m0: '', m1: '', m2: '', m3: '',
    pravilen: 0
  })
  const [loading, setLoading] = useState(false)
  const [prikazForma, setPrikazForma] = useState(false)

  useEffect(() => { loadVprasanja() }, [])

  async function loadVprasanja() {
    const { data } = await supabase.from('vprasanja').select('*').order('created_at', { ascending: false })
    setVprasanja(data || [])
  }

  async function dodajVprasanje() {
    if (!forma.vprasanje || !forma.m0 || !forma.m1) {
      showToast('Vnesi vprašanje in vsaj 2 odgovora.', 'error'); return
    }
    setLoading(true)
    const moznosti = [forma.m0, forma.m1, forma.m2, forma.m3].filter(m => m.trim())
    const { error } = await supabase.from('vprasanja').insert({
      vprasanje: forma.vprasanje,
      moznosti,
      pravilen_odgovor: parseInt(forma.pravilen),
      slika_url: forma.slika_url || null,
      kategorija: 'splosno'
    })
    if (error) showToast('Napaka: ' + error.message, 'error')
    else {
      showToast('Vprašanje dodano!')
      setForma({ vprasanje: '', slika_url: '', m0: '', m1: '', m2: '', m3: '', pravilen: 0 })
      setPrikazForma(false)
      loadVprasanja()
    }
    setLoading(false)
  }

  async function izbrisiVprasanje(id) {
    if (!confirm('Izbriši to vprašanje?')) return
    await supabase.from('vprasanja').delete().eq('id', id)
    loadVprasanja()
    showToast('Vprašanje izbrisano.')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontFamily: 'DM Mono', fontSize: '0.82rem', color: 'var(--muted)' }}>
          {vprasanja.length} vprašanj v bazi
        </span>
        <button onClick={() => setPrikazForma(f => !f)} className="btn-secondary">
          {prikazForma ? '✕ Zapri' : '+ Dodaj vprašanje'}
        </button>
      </div>

      {prikazForma && (
        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div className="form-field">
            <label>Vprašanje</label>
            <input value={forma.vprasanje} onChange={e => setForma(f => ({ ...f, vprasanje: e.target.value }))}
              placeholder="Vpiši besedilo vprašanja..." />
          </div>
          <div className="form-field">
            <label>URL slike (neobvezno — prometni znak ipd.)</label>
            <input value={forma.slika_url} onChange={e => setForma(f => ({ ...f, slika_url: e.target.value }))}
              placeholder="https://..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {['m0', 'm1', 'm2', 'm3'].map((k, i) => (
              <div key={k} className="form-field" style={{ margin: 0 }}>
                <label>Odgovor {String.fromCharCode(65 + i)} {i < 2 ? '*' : ''}</label>
                <input value={forma[k]} onChange={e => setForma(f => ({ ...f, [k]: e.target.value }))}
                  placeholder={`Odgovor ${String.fromCharCode(65 + i)}...`} />
              </div>
            ))}
          </div>
          <div className="form-field">
            <label>Pravilen odgovor</label>
            <select value={forma.pravilen} onChange={e => setForma(f => ({ ...f, pravilen: e.target.value }))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontFamily: 'DM Mono', fontSize: '0.85rem', outline: 'none', width: '100%' }}>
              {['m0', 'm1', 'm2', 'm3'].map((k, i) => forma[k] && (
                <option key={k} value={i}>Odgovor {String.fromCharCode(65 + i)}: {forma[k]}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={dodajVprasanje} disabled={loading}>
            {loading ? 'Dodajam...' : 'Dodaj vprašanje'}
          </button>
        </div>
      )}

      {/* Seznam vprašanj */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
        {vprasanja.length === 0 ? (
          <div className="empty">Ni vprašanj. Dodaj prvo vprašanje zgoraj.</div>
        ) : (
          vprasanja.map((v, i) => (
            <div key={v.id} style={{
              background: 'var(--surface2)', borderRadius: 8,
              padding: '12px 16px', display: 'flex',
              justifyContent: 'space-between', alignItems: 'flex-start', gap: 12
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  {vprasanja.length - i}. {v.vprasanje}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontFamily: 'DM Mono' }}>
                  ✓ {v.moznosti?.[v.pravilen_odgovor]}
                </div>
              </div>
              <button className="btn-danger" onClick={() => izbrisiVprasanje(v.id)}>Izbriši</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Admin({ showToast }) {
  const [iskanjeLimitov, setIskanjeLimitov] = useState('')
  const [rezervacije, setRezervacije] = useState([])
  const [kandidati, setKandidati] = useState([])
  const [limiti, setLimiti] = useState({})
  const [globalLimit, setGlobalLimit] = useState(2)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState('vse')
  const [selectedKandidat, setSelectedKandidat] = useState('')
  const [iskanjeIzbris, setIskanjeIzbris] = useState('')
  const [izbrisKandidat, setIzbrisKandidat] = useState('')

  useEffect(() => {
    loadData()
    loadNastavitve()
    const channel = supabase
      .channel('admin-rezervacije')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rezervacije' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function loadNastavitve() {
    const { data } = await supabase.from('nastavitve').select('*')
    if (data) {
      const gl = data.find(n => n.kljuc === 'max_rezervacij_teden')
      if (gl) setGlobalLimit(parseInt(gl.vrednost))
      const lim = {}
      data.filter(n => n.kljuc.startsWith('limit_')).forEach(n => {
        lim[n.kljuc.replace('limit_', '')] = parseInt(n.vrednost)
      })
      setLimiti(lim)
    }
  }

  async function loadData() {
    setLoading(true)
    const today = todayStr()
    const { data: rez } = await supabase
      .from('rezervacije')
      .select('*, termini(datum, cas_zacetek, cas_konec, tip, gcal_id), profili(id, ime, priimek, email)')
      .gte('termini.datum', today)
      .order('created_at', { ascending: false })
    const { data: kand } = await supabase
      .from('profili').select('*').eq('vloga', 'kandidat').order('priimek')
    const filtrirane = (rez || []).filter(r => r.termini?.datum >= today)
    setRezervacije(filtrirane)
    setKandidati(kand || [])
    setLoading(false)
  }

  async function prekliziRezervacijo(id) {
    if (!confirm('Prekliči to rezervacijo?')) return
    const rez = rezervacije.find(r => r.id === id)
    const gcalId = rez?.termini?.gcal_id
    const terminId = rez?.termin_id
    const { error } = await supabase.from('rezervacije').delete().eq('id', id)
    if (error) {
      showToast('Napaka pri preklicu.', 'error')
    } else {
      if (terminId) {
        await supabase.from('termini').update({ zaseden: false }).eq('id', terminId)
      }
      if (gcalId) {
        fetch(`${APPS_SCRIPT_URL}?action=preklic&gcalId=${encodeURIComponent(gcalId)}`).catch(() => { })
      }
      showToast('Rezervacija preklicana.')
      loadData()
    }
  }

  async function spremeniGlobalLimit(nov) {
    if (nov < 1) return
    setGlobalLimit(nov)
    await supabase.from('nastavitve').upsert({ kljuc: 'max_rezervacij_teden', vrednost: String(nov) }, { onConflict: 'kljuc' })
    showToast('Globalni limit posodobljen.')
  }

  async function spremeniLimitKandidata(kandidatId, nov) {
    if (nov < 1) return
    setLimiti(l => ({ ...l, [kandidatId]: nov }))
    await supabase.from('nastavitve').upsert({ kljuc: `limit_${kandidatId}`, vrednost: String(nov) }, { onConflict: 'kljuc' })
    showToast('Limit kandidata posodobljen.')
  }

  function getLimitZaKandidata(kandidatId) {
    return limiti[kandidatId] || globalLimit
  }

  function getRezervacijeZaKandidata(kandidatId) {
    return rezervacije.filter(r => r.profili?.id === kandidatId)
  }

  async function syncCalendar() {
    setSyncing(true)
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=sync`)
      const data = await res.json()
      if (data.success) {
        showToast(`Sinhronizirano: ${data.dodanih} terminov.`)
        loadData()
      } else {
        showToast('Napaka pri sinhronizaciji.', 'error')
      }
    } catch (e) {
      showToast('Napaka pri sinhronizaciji: ' + e.message, 'error')
    }
    setSyncing(false)
  }

  const today = todayStr()
  const prihodnje = rezervacije.filter(r => r.termini?.datum >= today)
  const danes = rezervacije.filter(r => r.termini?.datum === today)
  const filtrirane = filter === 'vse' ? rezervacije : rezervacije.filter(r => r.profili?.id === filter)

  if (loading) return <div className="page-wide"><div className="empty">Nalaganje...</div></div>

  return (
    <div className="page-wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>
            Admin <span style={{ color: 'var(--accent-bright)' }}>plošča</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', fontFamily: 'DM Mono', marginTop: 6 }}>
            Pregled rezervacij in upravljanje terminov
          </p>
        </div>
        <button onClick={syncCalendar} disabled={syncing} style={{
          padding: '10px 20px', background: 'rgba(6,182,212,0.12)', color: 'var(--accent3)',
          border: '1px solid rgba(6,182,212,0.3)', borderRadius: 10,
          fontFamily: 'Syne', fontSize: '0.88rem', fontWeight: 700,
          cursor: syncing ? 'wait' : 'pointer', opacity: syncing ? 0.6 : 1, transition: 'all 0.2s'
        }}>
          {syncing ? '↻ Sinhronizacija...' : '↻ Osveži iz Calendarja'}
        </button>
      </div>

      {/* STATISTIKE */}
      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-box">
          <div className="stat-num">{prihodnje.length}</div>
          <div className="stat-lbl">Prihodnjih rezervacij</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{danes.length}</div>
          <div className="stat-lbl">Danes</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{kandidati.length}</div>
          <div className="stat-lbl">Kandidatov</div>
        </div>
      </div>

      {/* GLOBALNI LIMIT + LIMIT PO KANDIDATU */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        <div className="card">
          <h2>Globalni tedenski limit</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => spremeniGlobalLimit(globalLimit - 1)} style={{
              width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
              background: 'var(--surface2)', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer'
            }}>−</button>
            <span style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-bright)', minWidth: 30, textAlign: 'center' }}>
              {globalLimit}
            </span>
            <button onClick={() => spremeniGlobalLimit(globalLimit + 1)} style={{
              width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
              background: 'var(--surface2)', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer'
            }}>+</button>
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: 'DM Mono' }}>
              vožnji na teden (privzeto)
            </span>
          </div>
        </div>

        <div className="card">
          <h2>Limit po kandidatu</h2>
          <div style={{ position: 'relative' }}>
            <input
              value={iskanjeLimitov}
              onChange={e => {
                setIskanjeLimitov(e.target.value)
                setSelectedKandidat('')
              }}
              placeholder="Išči kandidata..."
              style={{
                width: '100%', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: 8,
                padding: '10px 14px', color: 'var(--text)',
                fontFamily: 'DM Mono', fontSize: '0.85rem', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => setTimeout(() => e.target.style.borderColor = 'var(--border)', 150)}
            />
            {iskanjeLimitov && !selectedKandidat && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, marginTop: 4, zIndex: 100, overflow: 'hidden'
              }}>
                {kandidati
                  .filter(k => `${k.ime} ${k.priimek}`.toLowerCase().includes(iskanjeLimitov.toLowerCase()))
                  .map(k => (
                    <div key={k.id}
                      onMouseDown={() => {
                        setSelectedKandidat(k.id)
                        setIskanjeLimitov(`${k.ime} ${k.priimek}`)
                      }}
                      style={{
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '0.85rem'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {k.ime} {k.priimek}
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {selectedKandidat && (() => {
            const k = kandidati.find(x => x.id === selectedKandidat)
            const limit = getLimitZaKandidata(selectedKandidat)
            return (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '16px', marginTop: 8 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', fontFamily: 'DM Mono', marginBottom: 12 }}>{k?.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button onClick={() => spremeniLimitKandidata(selectedKandidat, limit - 1)} style={{
                    width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: '1.2rem'
                  }}>−</button>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-bright)', minWidth: 30, textAlign: 'center' }}>
                    {limit}
                  </span>
                  <button onClick={() => spremeniLimitKandidata(selectedKandidat, limit + 1)} style={{
                    width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: '1.2rem'
                  }}>+</button>
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: 'DM Mono' }}>vožnji na teden</span>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* REZERVACIJE */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0 }}>Rezervacije kandidatov</h2>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '7px 12px', color: 'var(--text)',
            fontFamily: 'DM Mono', fontSize: '0.8rem', outline: 'none'
          }}>
            <option value="vse">Vsi kandidati</option>
            {kandidati.map(k => (
              <option key={k.id} value={k.id}>{k.ime} {k.priimek}</option>
            ))}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kandidat</th>
                <th>Datum termina</th>
                <th>Ura</th>
                <th>Tip</th>
                <th>Rezervirano</th>
                <th>Rez. ta teden</th>
                <th>Akcija</th>
              </tr>
            </thead>
            <tbody>
              {filtrirane.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>Ni prihodnjih rezervacij.</td></tr>
              ) : (
                filtrirane
                  .sort((a, b) => (a.termini?.datum + a.termini?.cas_zacetek) > (b.termini?.datum + b.termini?.cas_zacetek) ? 1 : -1)
                  .map(r => {
                    const kandId = r.profili?.id
                    const rezTaTeden = getRezervacijeZaKandidata(kandId).filter(x => {
                      const d = x.termini?.datum || ''
                      const now = new Date(); now.setHours(0, 0, 0, 0)
                      const day = now.getDay() === 0 ? 7 : now.getDay()
                      const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
                      const sun = new Date(now); sun.setDate(now.getDate() - day + 7)
                      return d >= dateStr_(mon) && d <= dateStr_(sun)
                    }).length
                    const limit = getLimitZaKandidata(kandId)
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.profili?.ime} {r.profili?.priimek}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{r.profili?.email}</div>
                        </td>
                        <td>{r.termini?.datum ? formatDatum(r.termini.datum) : '–'}</td>
                        <td>{r.termini?.cas_zacetek?.slice(0, 5) || '–'}</td>
                        <td>
                          <span style={{
                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: 100,
                            background: r.termini?.tip === 'izpit' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                            color: r.termini?.tip === 'izpit' ? 'var(--accent2)' : 'var(--accent-bright)', fontWeight: 700
                          }}>
                            {r.termini?.tip === 'izpit' ? 'Izpit' : 'Vožnja'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{formatCas(r.created_at)}</td>
                        <td>
                          <span style={{ color: rezTaTeden >= limit ? 'var(--danger)' : 'var(--accent-bright)', fontWeight: 700 }}>
                            {rezTaTeden}/{limit}
                          </span>
                        </td>
                        <td>
                          <button className="btn-danger" onClick={() => prekliziRezervacijo(r.id)}>Prekliči</button>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* ODSTRANI KANDIDATA */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Odstrani kandidata</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: 'DM Mono', marginBottom: 16, lineHeight: 1.7 }}>
          Izbriši kandidata ki je že opravil izpit. Izbrisane bodo vse njegove rezervacije in profil.
        </p>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            value={iskanjeIzbris}
            onChange={e => {
              setIskanjeIzbris(e.target.value)
              setIzbrisKandidat('')
            }}
            placeholder="Išči kandidata..."
            style={{
              width: '100%', background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: 8,
              padding: '10px 14px', color: 'var(--text)',
              fontFamily: 'DM Mono', fontSize: '0.85rem', outline: 'none'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => setTimeout(() => e.target.style.borderColor = 'var(--border)', 150)}
          />
          {iskanjeIzbris && !izbrisKandidat && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, marginTop: 4, zIndex: 100, overflow: 'hidden'
            }}>
              {kandidati
                .filter(k => `${k.ime} ${k.priimek}`.toLowerCase().includes(iskanjeIzbris.toLowerCase()) ||
                  k.email.toLowerCase().includes(iskanjeIzbris.toLowerCase()))
                .map(k => (
                  <div key={k.id}
                    onMouseDown={() => {
                      setIzbrisKandidat(k.id)
                      setIskanjeIzbris(`${k.ime} ${k.priimek}`)
                    }}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)', fontSize: '0.85rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {k.ime} {k.priimek}
                    <span style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'DM Mono', marginLeft: 8 }}>
                      {k.email}
                    </span>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {izbrisKandidat && (
          <div style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 12,
            fontFamily: 'DM Mono', fontSize: '0.82rem', color: 'var(--muted)'
          }}>
            Izbran: <strong style={{ color: 'var(--text)' }}>{iskanjeIzbris}</strong>
          </div>
        )}

        <button onClick={async () => {
          if (!izbrisKandidat) { showToast('Izberi kandidata.', 'error'); return }
          const k = kandidati.find(x => x.id === izbrisKandidat)
          if (!confirm(`Res želiš izbrisati kandidata ${k?.ime} ${k?.priimek}? To je nepovrativo!`)) return
          const { error } = await supabase.rpc('izbrisi_kandidata', { kandidat_id: izbrisKandidat })
          if (error) {
            showToast('Napaka pri brisanju: ' + error.message, 'error')
          } else {
            showToast('Kandidat uspešno odstranjen.')
            setIskanjeIzbris('')
            setIzbrisKandidat('')
            loadData()
          }
        }} style={{
          padding: '10px 20px', background: 'rgba(239,68,68,0.12)',
          color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, fontFamily: 'Syne', fontSize: '0.88rem',
          fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
        }}>
          🗑 Izbriši kandidata
        </button>
      </div>
      {/* VPRAŠANJA ZA KVIZ */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Vprašanja za kviz</h2>
        <VprasanjaPanel showToast={showToast} />
      </div>
    </div>
  )
}