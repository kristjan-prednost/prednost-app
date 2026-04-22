import { useState } from 'react'

const PREJEMNIK = 'PREDNOST d.o.o.'
const IBAN = 'SI56 0410 3000 0248 937'

export default function Placila() {
  const [ure, setUre] = useState(10)

  const cenaPoUra = ure >= 20 ? 42 : 43
  const skupaj = ure * cenaPoUra

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.1 }}>
          Plačila <span style={{ color: 'var(--accent-bright)' }}>in QR kode</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Mono', marginTop: 10 }}>
          Skenirajte QR kodo z bančno aplikacijo za hitro plačilo.
        </p>
      </div>

      {/* MOTO URE */}
      <div className="form-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
          🚗 Moto ure
        </h3>

        {/* Kalkulator */}
        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'DM Mono', marginBottom: 14 }}>
            Kalkulator ur
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <button onClick={() => setUre(u => Math.max(1, u - 1))} style={{
              width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer'
            }}>−</button>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-bright)', minWidth: 40, textAlign: 'center' }}>
              {ure}
            </span>
            <button onClick={() => setUre(u => u + 1)} style={{
              width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer'
            }}>+</button>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Mono' }}>ur</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.82rem', color: 'var(--muted)' }}>
              {ure >= 20 ? '✅ Paketni popust — 42 €/uro' : `Še ${20 - ure} ur do paketnega popusta — 43 €/uro`}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-bright)' }}>
              {skupaj} €
            </div>
          </div>
        </div>

        {/* QR + podatki */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0 }}>
            <img src="/slike/qr-moto.png" alt="QR moto ure" style={{ width: 180, height: 180, borderRadius: 8 }} />
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.8rem', lineHeight: 2, color: 'var(--muted)' }}>
            <div><span style={{ color: 'var(--text)' }}>Prejemnik:</span> {PREJEMNIK}</div>
            <div><span style={{ color: 'var(--text)' }}>IBAN:</span> {IBAN}</div>
            <div><span style={{ color: 'var(--text)' }}>Namen:</span> Moto ure</div>
            <div><span style={{ color: 'var(--text)' }}>Referenca:</span> SI00 008</div>
            <div><span style={{ color: 'var(--accent-bright)', fontSize: '1rem', fontWeight: 700 }}>Znesek: {skupaj} €</span></div>
          </div>
        </div>
      </div>

      {/* PREIZKUSNA VOŽNJA */}
      <div className="form-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
          🎓 Preizkusna vožnja
        </h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0 }}>
            <img src="/slike/qr-preizkus.png" alt="QR preizkus" style={{ width: 180, height: 180, borderRadius: 8 }} />
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.8rem', lineHeight: 2, color: 'var(--muted)' }}>
            <div><span style={{ color: 'var(--text)' }}>Prejemnik:</span> {PREJEMNIK}</div>
            <div><span style={{ color: 'var(--text)' }}>IBAN:</span> {IBAN}</div>
            <div><span style={{ color: 'var(--text)' }}>Namen:</span> preizkus</div>
            <div><span style={{ color: 'var(--text)' }}>Referenca:</span> SI99</div>
            <div><span style={{ color: 'var(--accent-bright)', fontSize: '1rem', fontWeight: 700 }}>Znesek: 25,00 €</span></div>
          </div>
        </div>
      </div>

      {/* ČAKALNA URA */}
      <div className="form-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
          ⏱️ Čakalna ura
        </h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0 }}>
            <img src="/slike/qr-cakalna.png" alt="QR čakalna" style={{ width: 180, height: 180, borderRadius: 8 }} />
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.8rem', lineHeight: 2, color: 'var(--muted)' }}>
            <div><span style={{ color: 'var(--text)' }}>Prejemnik:</span> {PREJEMNIK}</div>
            <div><span style={{ color: 'var(--text)' }}>IBAN:</span> {IBAN}</div>
            <div><span style={{ color: 'var(--text)' }}>Namen:</span> čakalna ura</div>
            <div><span style={{ color: 'var(--text)' }}>Referenca:</span> SI99</div>
            <div><span style={{ color: 'var(--accent-bright)', fontSize: '1rem', fontWeight: 700 }}>Znesek: 25,00 €</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}