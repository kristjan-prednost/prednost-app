import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const NAVODILA = `Pozdravljeni,

Dobrodošli v sistemu Šole vožnje Prednost. Pred začetkom ur vožnje si temeljito preberite spodnja navodila. Vsebujejo vse ključne informacije o poteku usposabljanja, obvezni dokumentaciji in praktičnih vajah.

Srečali se bomo na železniški postaji v Ptuju, kjer vas bom čakal z vozilom Dacia Sandero.

Ob vsakem pristopu k vožnji morate imeti pri sebi:
- originalno in veljavno zdravniško spričevalo za kategorijo B
- veljaven osebni dokument (osebna izkaznica ali potni list)
- očala oziroma leče, če je to navedeno v zdravniškem spričevalu (kodi 01.01, 01.06)

Pred začetkom prve ure vožnje je potrebno poravnati stroške uporabe poligona na Javnih službah Ptuj (ul. Heroja Lacka 3), cena je cca. 50 EUR. Ob plačilu predložite evidenčni karton, v katerega prejmete žig za neomejeno uporabo poligona.

Vožnje bodo potekale v obsegu 2x po 50 min (skupaj 1h30–1h40).

V primeru odpovedi ure vožnje prosim za obvestilo vsaj 24 ur pred napovedanim terminom, saj se v nasprotnem primeru zaračuna čakalna ura.

Za vse dodatne informacije sem dosegljiv na telefonski številki 040 315 707 vsak delovnik.`

const NAVODILA_SPREMLJEVALEC = `Če se odločite za vožnjo s spremljevalcem, si pred obiskom upravne enote pripravite:
- izpolnjeno vlogo za vpis spremljevalca (v prilogi)
- potrdilo iz evidence kazenskih točk

Vlogo oddate na upravni enoti — ne na ptujski UE, saj so čakalne dobe tam tudi do enega meseca, temveč na kateri koli drugi UE.`

// Privzeti priročniki — admin jih lahko dopolni v Supabase
const PRIVZETO_GRADIVO = [
  {
    id: '1',
    naslov: 'Osnovne informacije Dacia Sandero',
    tip: 'prirocnik',
    url: 'https://drive.google.com/file/d/17mF1Pg09I25ufwSoODiV9ZUamrJl20X0/view?usp=drive_link',
    opis: 'Tehnični podatki in osnovna navodila za vozilo'
  },
  {
    id: '2',
    naslov: 'Navodila za opravljanje vaj na poligonu',
    tip: 'prirocnik',
    url: 'https://drive.google.com/file/d/1e475IhFrewfFM2au6AbLWYNR-28DvXnN/view?usp=drive_link',
    opis: 'Postopki za parkiranje, obračanje in ostale vaje'
  },
  {
    id: '3',
    naslov: 'Primeri vprašanj izpitne komisije',
    tip: 'prirocnik',
    url: 'https://drive.google.com/file/d/18EUCexyw3YInSRxA84nHSpObiUhsqXao/view?usp=drive_link',
    opis: 'Najpogostejša vprašanja na izpitni vožnji'
  },
  {
    id: '4',
    naslov: 'Vloga za vpis spremljevalca',
    tip: 'prirocnik',
    url: 'https://docs.google.com/document/d/1xwdgWnJG8XMeOz_E4vAV1mij6fYewo-O/edit?usp=drive_link',
    opis: 'Obrazec za vožnjo s spremljevalcem'
  },
]

export default function Gradivo() {
  const [gradivo, setGradivo] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('navodila')

  useEffect(() => { loadGradivo() }, [])

  async function loadGradivo() {
    setLoading(true)
    const { data } = await supabase
      .from('gradivo')
      .select('*')
      .order('vrstni_red')
    setGradivo(data?.length ? data : PRIVZETO_GRADIVO)
    setLoading(false)
  }

  const prirocniki = gradivo.filter(g => g.tip === 'prirocnik')
  const videi = gradivo.filter(g => g.tip === 'video')

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.1 }}>
          Gradivo & <span style={{ color: 'var(--accent-bright)' }}>navodila</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Mono', marginTop: 10 }}>
          Vse kar potrebujete pred začetkom vožnje.
        </p>
      </div>

      {/* TABOVI */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'navodila', label: '📋 Navodila' },
          { key: 'prirocniki', label: '📄 Priročniki' },
          { key: 'videi', label: '🎥 Videoposnetki' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`nav-tab ${activeTab === t.key ? 'active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* NAVODILA */}
      {activeTab === 'navodila' && (
        <div>
          <div className="form-box">
            <h3>Splošna navodila</h3>
            {NAVODILA.split('\n\n').map((par, i) => (
              <p key={i} style={{
                color: par.startsWith('•') ? 'var(--text)' : 'var(--muted)',
                fontSize: '0.88rem', fontFamily: 'DM Mono', lineHeight: 1.8,
                marginBottom: 14, whiteSpace: 'pre-line'
              }}>{par}</p>
            ))}
          </div>

          <div className="form-box" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' }}>
            <h3 style={{ color: 'var(--accent2)' }}>Vožnja s spremljevalcem</h3>
            <p style={{
              color: 'var(--muted)', fontSize: '0.88rem', fontFamily: 'DM Mono',
              lineHeight: 1.8, whiteSpace: 'pre-line'
            }}>{NAVODILA_SPREMLJEVALEC}</p>
          </div>
        </div>
      )}

      {/* PRIROČNIKI */}
      {activeTab === 'prirocniki' && (
        <div>
          {loading ? (
            <div className="empty">Nalaganje...</div>
          ) : prirocniki.length === 0 ? (
            <div className="empty">Ni priročnikov.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {prirocniki.map(p => (
                <div key={p.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 100, fontSize: '0.95rem', marginBottom: 4 }}>
                      📄 {p.naslov}
                    </div>
                    {p.opis && (
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', fontFamily: 'DM Mono' }}>
                        {p.opis}
                      </div>
                    )}
                  </div>
                  {p.url && p.url !== '#' && (
                    <a href={p.url} target="_blank" rel="noreferrer" style={{
                      padding: '9px 18px',
                      background: 'var(--accent)',
                      color: '#fff',
                      borderRadius: 8,
                      fontFamily: 'Syne', fontSize: '0.82rem', fontWeight: 700,
                      textDecoration: 'none', whiteSpace: 'nowrap'
                    }}>
                      ↓ Prenesi
                    </a>
                  )}
                  {(!p.url || p.url === '#') && (
                    <span style={{
                      padding: '9px 18px', background: 'var(--surface2)',
                      color: 'var(--muted)', borderRadius: 8,
                      fontFamily: 'DM Mono', fontSize: '0.78rem'
                    }}>Kmalu</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIDEI */}
      {activeTab === 'videi' && (
        <div>
          {loading ? (
            <div className="empty">Nalaganje...</div>
          ) : videi.length === 0 ? (
            <div className="empty" style={{ padding: '60px 20px' }}>
              🎥 Videoposnetki bodo kmalu na voljo.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {videi.map(v => (
                <a key={v.id} href={v.url} target="_blank" rel="noreferrer" style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, flexWrap: 'wrap', textDecoration: 'none', color: 'var(--text)',
                  transition: 'border-color 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                   onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                      ▶ {v.naslov}
                    </div>
                    {v.opis && (
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', fontFamily: 'DM Mono' }}>
                        {v.opis}
                      </div>
                    )}
                  </div>
                  <span style={{
                    padding: '9px 18px', background: 'rgba(239,68,68,0.12)',
                    color: '#ff4444', borderRadius: 8,
                    fontFamily: 'Syne', fontSize: '0.82rem', fontWeight: 700
                  }}>▶ YouTube</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}