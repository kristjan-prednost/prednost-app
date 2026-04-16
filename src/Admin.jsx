import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzVA3SPUGUBmrkhTs0sJeh1B2djOmx4GDh06Nwy45dCuZBk0aQra7t1r29yXgxmHKK/exec'

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = 'cb_' + Math.random().toString(36).slice(2)
    window[cb] = (data) => { delete window[cb]; document.head.removeChild(s); resolve(data) }
    const s = document.createElement('script')
    s.src = url + '&callback=' + cb
    s.onerror = () => { delete window[cb]; document.head.removeChild(s); reject(new Error('JSONP napaka')) }
    document.head.appendChild(s)
  })
}

function isoTeden(dateStr) {
  const [d, m, y] = dateStr.replace(/'/g, '').split('.')
  const dt = new Date(Number(y), Number(m) - 1, Number(d))
  const tmp = new Date(dt)
  tmp.setHours(0, 0, 0, 0)
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
  const w1 = new Date(tmp.getFullYear(), 0, 4)
  const teden = 1 + Math.round(((tmp - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7)
  return `${dt.getFullYear()}-W${String(teden).padStart(2, '0')}`
}

function parseD(s) {
  if (!s) return new Date(0)
  // Podpira DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
    const [d, m, y] = s.split('.')
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  return new Date(s)
}

export default function Admin() {
  const [rezervacije, setRezervacije] = useState([])
  const [omejitve, setOmejitve] = useState([])
  const [globalLimit, setGlobalLimit] = useState(2)
  const [nalaga, setNalaga] = useState(true)
  const [novoIme, setNovoIme] = useState('')
  const [novLimit, setNovLimit] = useState(3)
  const [sporocilo, setSporocilo] = useState(null)
  const [preklicula, setPreklicula] = useState(null)

  const naložiVse = useCallback(async () => {
    setNalaga(true)
    try {
      const res = await jsonp(`${SCRIPT_URL}?action=getReservations`)
      if (res.success) setRezervacije(res.reservations || [])

      const { data: omej } = await supabase.from('omejitve').select('*')
      if (omej) setOmejitve(omej)

      const { data: set } = await supabase.from('nastavitve').select('*').eq('kljuc', 'globalLimit').single()
      if (set) setGlobalLimit(Number(set.vrednost))
    } catch {
      setSporocilo({ tip: 'napaka', tekst: 'Napaka pri nalaganju.' })
    }
    setNalaga(false)
  }, [])

  useEffect(() => { naložiVse() }, [naložiVse])

  async function shraniGlobalLimit(val) {
    setGlobalLimit(val)
    await supabase.from('nastavitve').upsert({ kljuc: 'globalLimit', vrednost: String(val) })
  }

  async function dodajOmejitev() {
    if (!novoIme.trim()) return
    const nova = { ime: novoIme.trim(), limit: novLimit }
    const { error } = await supabase.from('omejitve').upsert(nova, { onConflict: 'ime' })
    if (!error) {
      setOmejitve(prev => [...prev.filter(o => o.ime !== nova.ime), nova])
      setNovoIme('')
      setNovLimit(3)
      setSporocilo({ tip: 'uspeh', tekst: `Omejitev za ${nova.ime} nastavljena.` })
    }
  }

  async function odstraniOmejitev(ime) {
    await supabase.from('omejitve').delete().eq('ime', ime)
    setOmejitve(prev => prev.filter(o => o.ime !== ime))
  }

  async function prekliči(rez) {
    setPreklicula(rez.slotId)
    try {
      const data = JSON.stringify({ gcalId: rez.gcalId, slotId: rez.slotId })
      const res = await jsonp(`${SCRIPT_URL}?action=cancelAdmin&data=${encodeURIComponent(data)}`)
      if (res.success) {
        setRezervacije(prev => prev.filter(r => r.slotId !== rez.slotId))
        setSporocilo({ tip: 'uspeh', tekst: `Rezervacija za ${rez.ime} preklicana.` })
      } else {
        setSporocilo({ tip: 'napaka', tekst: 'Napaka pri preklicu.' })
      }
    } catch {
      setSporocilo({ tip: 'napaka', tekst: 'Napaka pri preklicu.' })
    }
    setPreklicula(null)
  }

  function limitZaKandidata(ime) {
    const omej = omejitve.find(o => o.ime === ime)
    return omej ? omej.limit : globalLimit
  }

  function porabaVTednu(ime) {
    const danes = new Date()
    const d = String(danes.getDate()).padStart(2,'0')
    const m = String(danes.getMonth()+1).padStart(2,'0')
    const y = danes.getFullYear()
    const teden = isoTeden(`${d}.${m}.${y}`)
    return rezervacije.filter(r => r.ime === ime && r.datum && isoTeden(r.datum) === teden).length
  }

  if (nalaga) return <p className="nalaga-tekst">Nalagam...</p>

  return (
    <div className="admin">
      {sporocilo && (
        <div className={`sporocilo ${sporocilo.tip}`} onClick={() => setSporocilo(null)}>
          {sporocilo.tekst} <span className="zapri">✕</span>
        </div>
      )}

      {/* Nastavitve */}
      <div className="admin-sekcija">
        <h3 className="admin-naslov">Nastavitve</h3>
        <div className="admin-kartica">
          <div className="nastav-vrstica">
            <div>
              <p className="nastav-ime">Maks. rezervacij na teden</p>
              <p className="nastav-opis">Privzeto za vse kandidate</p>
            </div>
            <div className="stevilka-ctrl">
              <button onClick={() => shraniGlobalLimit(Math.max(1, globalLimit - 1))}>−</button>
              <span>{globalLimit}</span>
              <button onClick={() => shraniGlobalLimit(globalLimit + 1)}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Izjeme po kandidatu */}
      <div className="admin-sekcija">
        <h3 className="admin-naslov">Izjeme po kandidatu</h3>
        <div className="admin-kartica">
          <p className="nastav-opis" style={{marginBottom: '12px'}}>Nastavi drugačno omejitev za posameznega kandidata.</p>
          <div className="omejitev-vnosna">
            <input
              className="admin-input"
              placeholder="Ime in priimek"
              value={novoIme}
              onChange={e => setNovoIme(e.target.value)}
            />
            <div className="stevilka-ctrl mali">
              <button onClick={() => setNovLimit(Math.max(1, novLimit - 1))}>−</button>
              <span>{novLimit}</span>
              <button onClick={() => setNovLimit(novLimit + 1)}>+</button>
            </div>
            <button className="gumb-dodaj" onClick={dodajOmejitev}>Dodaj</button>
          </div>
          {omejitve.length > 0 && (
            <div className="omejitve-seznam">
              {omejitve.map(o => (
                <div key={o.ime} className="omejitev-vrstica">
                  <span>{o.ime} → max <strong>{o.limit}x</strong></span>
                  <button className="gumb-odstrani" onClick={() => odstraniOmejitev(o.ime)}>Odstrani</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rezervacije */}
      <div className="admin-sekcija">
        <h3 className="admin-naslov">Rezervacije kandidatov</h3>
        <div className="admin-kartica">
          {rezervacije.length === 0 ? (
            <p className="ni-terminov">Ni rezervacij.</p>
          ) : (
            <table className="rez-tabela">
              <thead>
                <tr>
                  <th>Ime in priimek</th>
                  <th>Datum</th>
                  <th>Termin</th>
                  <th>Akcija</th>
                </tr>
              </thead>
              <tbody>
                {[...rezervacije]
                  .sort((a, b) => parseD(a.datum) - parseD(b.datum))
                  .map(rez => {
                    const poraba = porabaVTednu(rez.ime)
                    const limit = limitZaKandidata(rez.ime)
                    const prekoračen = poraba > limit
                    return (
                      <tr key={rez.slotId} className={prekoračen ? 'rez-prekoracen' : ''}>
                        <td>{rez.ime}</td>
                        <td>{rez.datum ? rez.datum : '—'}</td>
                        <td>{rez.timeStart ? String(rez.timeStart).slice(0,5) : '—'}</td>
                        <td>
                          <button
                            className="gumb-preklic-admin"
                            onClick={() => prekliči(rez)}
                            disabled={preklicula === rez.slotId}
                          >
                            {preklicula === rez.slotId ? '...' : 'Prekliči'}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  )
}