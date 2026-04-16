import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const MESECI = ['Januar','Februar','Marec','April','Maj','Junij','Julij','Avgust','September','Oktober','November','December']
const DNI = ['Pon','Tor','Sre','Čet','Pet','Sob','Ned']

function dateStr(d) {
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
function dateStr_(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function Termini({ profil, showToast }) {
  const [termini, setTermini] = useState([])
  const [rezervacije, setRezervacije] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [booking, setBooking] = useState(false)

  // Koledar
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  // Teden
  const todayS = todayStr()
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
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

  // Tedenske datume
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

  // Prosti termini tega tedna
  const prostTermini = termini.filter(t =>
    !t.zaseden &&
    t.datum >= weekStart &&
    t.datum <= weekEnd &&
    t.datum >= todayS
  )

  // Dnevi s prostimi termini (za piko v koledarju)
  const prostiDnevi = new Set(termini.filter(t => !t.zaseden && t.datum >= todayS).map(t => t.datum))

  // Moje rezervacije
  const mojeRez = new Set(rezervacije.map(r => r.termin_id))

  // Tedenski limit
  function getWeekCount(weekStartStr, weekEndStr) {
    return rezervacije.filter(r => {
      const d = r.termini?.datum || ''
      return d >= weekStartStr && d <= weekEndStr
    }).length
  }

  // Koledar render
  function renderKoledar() {
    const firstDay = new Date(calYear, calMonth, 1)
    const lastDay = new Date(calYear, calMonth + 1, 0)
    const startDow = firstDay.getDay() === 0 ? 7 : firstDay.getDay()
    const todayFull = todayStr()

    const cells = []
    // Prazne celice pred prvim
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

        {/* Dnevi v tednu */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {DNI.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'DM Mono', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Celice */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const isPast = ds < todayFull
            const hasFree = prostiDnevi.has(ds)
            const isToday = ds === todayFull
            const inWeek = ds >= weekStart && ds <= weekEnd

            return (
              <div key={i} onClick={() => {
                if (!isPast) {
                  // Pojdi na teden ki vsebuje ta datum
                  const ws = getWeekStart(ds)
                  const curWs = weekDates[0]
                  // Izračunaj offset
                  const diff = Math.round((new Date(ws) - new Date(getWeekStart(todayStr()))) / (7*24*3600*1000))
                  if (diff >= 0) setWeekOffset(diff)
                }
              }} style={{
                textAlign: 'center',
                padding: '6px 2px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontFamily: 'DM Mono',
                cursor: isPast ? 'default' : 'pointer',
                color: isPast ? 'var(--muted)' : 'var(--text)',
                background: inWeek && !isPast ? 'rgba(59,130,246,0.1)' : isToday ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: isToday ? '1px solid var(--accent)' : '1px solid transparent',
                position: 'relative',
                transition: 'all 0.15s'
              }}>
                {d}
                {hasFree && (
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'var(--accent-bright)',
                    margin: '2px auto 0',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  async function rezerviraj() {
    if (!selected) return
    const termin = termini.find(t => t.id === selected)
    if (!termin) return

    // Preveri tedenski limit
    const ws = getWeekStart(termin.datum)
    const we = weekDates[6]
    // Izračunaj week end za ta termin
    const td = new Date(termin.datum + 'T00:00:00')
    const tdDay = td.getDay() === 0 ? 7 : td.getDay()
    const weMon = new Date(td)
    weMon.setDate(td.getDate() - tdDay + 7)
    const weStr = dateStr_(weMon)

    const count = getWeekCount(ws, weStr)
    if (count >= 2) {
      showToast('Dosegel si tedenski limit (2x). Kontaktiraj inštruktorja.', 'error')
      return
    }

    setBooking(true)
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
      showToast('Rezervacija uspešna! 🚗')
      setSelected(null)
      await loadData()
    }
    setBooking(false)
  }

  if (loading) return <div className="page"><div className="empty">Nalaganje...</div></div>

  const w0 = weekDates[0], w6 = weekDates[6]
  const d0 = new Date(w0+'T00:00:00'), d6 = new Date(w6+'T00:00:00')
  const weekLabel = `${d0.getDate()}.${d0.getMonth()+1} – ${d6.getDate()}.${d6.getMonth()+1}`

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
          Rezerviraj<br /><span style={{ color: 'var(--accent-bright)' }}>termin vožnje</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Mono', marginTop: 10 }}>
          Izberi prosti termin in rezerviraj.
        </p>
      </div>

      {/* KOLEDAR */}
      <div className="form-box">
        {renderKoledar()}
      </div>

      {/* TERMINI TEDNA */}
      <div className="form-box">
        <div className="slots-header">
          <h3 style={{ margin: 0 }}>IZBERI TERMIN</h3>
          <div className="week-nav">
            <button onClick={() => { if (weekOffset > 0) setWeekOffset(o => o-1) }}>‹</button>
            <div className="week-label">{weekLabel}</div>
            <button onClick={() => setWeekOffset(o => o+1)}>›</button>
          </div>
        </div>

        {prostTermini.length === 0 ? (
          <div className="empty">Ni prostih terminov ta teden.<br />Klikni na dan v koledarju ali preveri naslednji teden →</div>
        ) : (
          <div className="slots-grid">
            {prostTermini.map(t => {
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
    </div>
  )
}