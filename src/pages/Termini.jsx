import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTHM_Ntkwpcrn7LkhoavQNLeErkoqtDaqQEZQZ03vJ4Spx1KJe-tItfjkDCw2HbN3C/exec'

const MESECI = ['Januar','Februar','Marec','April','Maj','Junij','Julij','Avgust','September','Oktober','November','December']
const DNI = ['Pon','Tor','Sre','Čet','Pet','Sob','Ned']

function dateStr_(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function formatDatum(d) {
  const dt = new Date(d + 'T00:00:00')
  const dni = ['Ned','Pon','Tor','Sre','Čet','Pet','Sob']
  const mes = ['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec']
  return `${dni[dt.getDay()]}, ${dt.getDate()}. ${mes[dt.getMonth()]}`
}
function addMinutes(t, m) {
  const [h, min] = t.split(':').map(Number)
  const tot = h * 60 + min + m
  return `${String(Math.floor(tot/60)).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`
}
function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - day + 1)
  return dateStr_(d)
}

export default function Termini({ profil, showToast }) {
  const [termini, setTermini] = useState([])
  const [rezervacije, setRezervacije] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [booking, setBooking] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [potrjeno, setPotrjeno] = useState(null)

  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    loadData(true)
    const channel = supabase
      .channel('termini-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'termini' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rezervacije' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [profil?.id])

  async function loadData(prvic = false) {
    if (prvic) setLoading(true)
    const { data: t } = await supabase
      .from('termini')
      .select('*')
      .gte('datum', todayStr())
      .order('datum').order('cas_zacetek')
    const { data: r } = await supabase
      .from('rezervacije')
      .select('*, termini(datum, cas_zacetek)')
      .eq('kandidat_id', profil.id)
    setTermini(t || [])
    setRezervacije(r || [])
    setLoading(false)
  }

  function getWeekDates() {
    const d = new Date()
    d.setHours(0,0,0,0)
    const day = d.getDay() === 0 ? 7 : d.getDay()
    d.setDate(d.getDate() - day + 1 + weekOffset * 7)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const x = new Date(d)
      x.setDate(d.getDate() + i)
      dates.push(dateStr_(x))
    }
    return dates
  }

  const weekDates = getWeekDates()
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]
  const todayS = todayStr()

  const prostiDnevi = new Set(
    termini.filter(t => !t.zaseden && t.datum >= todayS).map(t => t.datum)
  )
  const mojeRez = new Set(rezervacije.map(r => r.termin_id))

  const vidniTermini = termini.filter(t =>
    !t.zaseden &&
    t.datum >= todayS &&
    (selectedDay ? t.datum === selectedDay : (t.datum >= weekStart && t.datum <= weekEnd))
  )

  function getWeekCount(weekStartStr, weekEndStr) {
    return rezervacije.filter(r => {
      const d = r.termini?.datum || ''
      return d >= weekStartStr && d <= weekEndStr
    }).length
  }

  function renderKoledar() {
    const firstDay = new Date(calYear, calMonth, 1)
    const lastDay = new Date(calYear, calMonth + 1, 0)
    const startDow = firstDay.getDay() === 0 ? 7 : firstDay.getDay()
    const todayFull = todayStr()
    const cells = []
    for (let i = 1; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)

    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button className="week-nav-btn" onClick={() => {
            if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) }
            else setCalMonth(m => m-1)
          }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1 }}>
            {MESECI[calMonth].toUpperCase()} {calYear}
          </span>
          <button className="week-nav-btn" onClick={() => {
            if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) }
            else setCalMonth(m => m+1)
          }}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {DNI.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'DM Mono', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const isPast = ds < todayFull
            const hasFree = prostiDnevi.has(ds)
            const isToday = ds === todayFull
            const isSelected = ds === selectedDay
            return (
              <div key={i} onClick={() => {
                if (isPast) return
                if (selectedDay === ds) {
                  setSelectedDay(null)
                } else {
                  setSelectedDay(ds)
                  const ws = getWeekStart(ds)
                  const curWs = getWeekStart(todayS)
                  const diff = Math.round((new Date(ws) - new Date(curWs)) / (7*24*3600*1000))
                  if (diff >= 0) setWeekOffset(diff)
                }
              }} style={{
                textAlign: 'center', padding: '6px 2px', borderRadius: 8,
                fontSize: '0.82rem', fontFamily: 'DM Mono',
                cursor: isPast ? 'default' : 'pointer',
                color: isPast ? 'var(--muted)' : 'var(--text)',
                background: isSelected ? 'rgba(59,130,246,0.25)' : isToday ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: isSelected ? '1px solid var(--accent-bright)' : isToday ? '1px solid var(--accent)' : '1px solid transparent',
                transition: 'all 0.15s'
              }}>
                {d}
                {hasFree && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-bright)', margin: '2px auto 0' }} />
                )}
              </div>
            )
          })}
        </div>

        {selectedDay && (
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <button onClick={() => setSelectedDay(null)} style={{
              background: 'transparent', border: 'none', color: 'var(--muted)',
              fontFamily: 'DM Mono', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline'
            }}>← Pokaži cel teden</button>
          </div>
        )}
      </div>
    )
  }

  async function rezerviraj() {
    if (!selected) return
    const termin = termini.find(t => t.id === selected)
    if (!termin) return

    const td = new Date(termin.datum + 'T00:00:00')
    const tdDay = td.getDay() === 0 ? 7 : td.getDay()
    const wsDate = new Date(td); wsDate.setDate(td.getDate() - tdDay + 1)
    const weDate = new Date(td); weDate.setDate(td.getDate() - tdDay + 7)
    const wsStr = dateStr_(wsDate)
    const weStr = dateStr_(weDate)

    const count = getWeekCount(wsStr, weStr)
    const { data: limitData } = await supabase.from('nastavitve').select('vrednost').eq('kljuc', `limit_${profil.id}`).single()
    const { data: globalData } = await supabase.from('nastavitve').select('vrednost').eq('kljuc', 'max_rezervacij_teden').single()
    const limit = limitData ? parseInt(limitData.vrednost) : (globalData ? parseInt(globalData.vrednost) : 2)

    if (count >= limit) {
      showToast(`Dosegel si tedenski limit (${limit}x). Kontaktiraj inštruktorja.`, 'error')
      return
    }

    setBooking(true)

    const { data: svezTermin } = await supabase.from('termini').select('zaseden').eq('id', selected).single()
    if (svezTermin?.zaseden) {
      showToast('Ta termin je bil ravnokar zaseden. Izberi drugega.', 'error')
      setSelected(null)
      await loadData()
      setBooking(false)
      return
    }

    const { error } = await supabase.from('rezervacije').insert({
      kandidat_id: profil.id,
      termin_id: selected
    })

    if (error) {
      if (error.message.includes('unique') || error.message.includes('LIMIT')) {
        showToast('Ta termin je zaseden ali si dosegel limit.', 'error')
      } else {
        showToast('Napaka: ' + error.message, 'error')
      }
    } else {
      await supabase.from('termini').update({ zaseden: true }).eq('id', selected)
      if (termin.gcal_id) {
        const ime = `${profil.ime} ${profil.priimek}`
        fetch(`${APPS_SCRIPT_URL}?action=rezerviraj&gcalId=${encodeURIComponent(termin.gcal_id)}&ime=${encodeURIComponent(ime)}`).catch(() => {})
      }
      setPotrjeno({ datum: termin.datum, cas: termin.cas_zacetek.slice(0,5) })
      setSelected(null)
      await loadData()
    }
    setBooking(false)
  }

  if (loading) return <div className="page"><div className="empty">Nalaganje...</div></div>

  const w0 = weekDates[0], w6 = weekDates[6]
  const d0 = new Date(w0+'T00:00:00'), d6 = new Date(w6+'T00:00:00')
  const weekLabel = selectedDay
    ? formatDatum(selectedDay)
    : `${d0.getDate()}.${d0.getMonth()+1} – ${d6.getDate()}.${d6.getMonth()+1}`

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.1 }}>
          Rezerviraj <span style={{ color: 'var(--accent-bright)' }}>termin vožnje</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Mono', marginTop: 10 }}>
          Izberi dan v koledarju ali uporabi puščice za navigacijo po tednih.
        </p>
      </div>

      <div className="form-box">
        {renderKoledar()}
      </div>

      <div className="form-box">
        <div className="slots-header">
          <h3 style={{ margin: 0 }}>
            {selectedDay ? formatDatum(selectedDay).toUpperCase() : 'IZBERI TERMIN'}
          </h3>
          {!selectedDay && (
            <div className="week-nav">
              <button onClick={() => { if (weekOffset > 0) setWeekOffset(o => o-1) }}>‹</button>
              <div className="week-label">{weekLabel}</div>
              <button onClick={() => setWeekOffset(o => o+1)}>›</button>
            </div>
          )}
        </div>

        {vidniTermini.length === 0 ? (
          <div className="empty">
            {selectedDay ? 'Ni prostih terminov ta dan.' : 'Ni prostih terminov ta teden.'}<br />
            {selectedDay ? 'Klikni na drug dan v koledarju.' : 'Preveri naslednji teden →'}
          </div>
        ) : (
          <div className="slots-grid">
            {vidniTermini.map(t => {
              const casKonec = t.cas_konec || addMinutes(t.cas_zacetek.slice(0,5), 100)
              const timeLabel = `${t.cas_zacetek.slice(0,5)} – ${casKonec.slice(0,5)}`
              const isMoj = mojeRez.has(t.id)
              const isSelected = selected === t.id
              return (
                <div key={t.id}
                  className={`slot-item ${isSelected ? 'selected' : ''} ${isMoj ? 'taken' : ''}`}
                  onClick={() => { if (!isMoj) setSelected(t.id === selected ? null : t.id) }}
                >
                  <div>
                    <div className="slot-time">{timeLabel}</div>
                    <div className="slot-date">{formatDatum(t.datum)}</div>
                  </div>
                  <span className={`badge ${isMoj ? 'badge-moja' : t.tip === 'izpit' ? 'badge-izpit' : 'badge-free'}`}>
                    {isMoj ? 'Moja rezervacija' : t.tip === 'izpit' ? 'Izpitna' : 'Prosto'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        <div style={{
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 14,
          fontFamily: 'DM Mono', fontSize: '0.85rem'
        }}>
          Izbrano: <strong style={{ color: 'var(--accent-bright)' }}>
            {(() => { const t = termini.find(x => x.id === selected); return t ? `${formatDatum(t.datum)}, ${t.cas_zacetek.slice(0,5)}` : '' })()}
          </strong>
        </div>
      )}

      <button className="btn-primary" disabled={!selected || booking} onClick={rezerviraj}>
        {booking ? 'Rezerviram...' : 'Rezerviraj termin'}
      </button>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.78rem', fontFamily: 'DM Mono', marginTop: 14, lineHeight: 1.7 }}>
        V kolikor se ti ponujeni termini ne ujamajo popolnoma z urnikom,<br />
        rezerviraj najbližji možni termin in stopite v stik z inštruktorjem<br />
        za morebitno prilagoditev.
      </p>

      {/* POTRDITVENI MODAL */}
      {potrjeno && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }} onClick={() => setPotrjeno(null)}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--accent)',
            borderRadius: 20, padding: '40px 36px', maxWidth: 420, width: '100%',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(59,130,246,0.15)', border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: '2rem'
            }}>✓</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: 8 }}>
              Rezervacija<br /><span style={{ color: 'var(--accent-bright)' }}>potrjena!</span>
            </h2>
            <div style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '20px 24px', margin: '24px 0', textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontFamily: 'DM Mono', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--muted)' }}>Datum</span>
                <span style={{ fontWeight: 600 }}>{formatDatum(potrjeno.datum)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontFamily: 'DM Mono', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--muted)' }}>Ura</span>
                <span style={{ fontWeight: 600 }}>{potrjeno.cas}</span>
              </div>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: 'DM Mono', lineHeight: 1.7, marginBottom: 24 }}>
              V kolikor moraš odpovedati termin,<br />kontaktiraj inštruktorja. Srečno! 🚗
            </p>
            <button className="btn-primary" onClick={() => setPotrjeno(null)}>
              Zapri
            </button>
          </div>
        </div>
      )}
    </div>
  )
}