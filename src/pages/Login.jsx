import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login({ onSwitch, showToast }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function login(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) showToast(error.message, 'error')
    setLoading(false)
  }

  async function posljiReset(e) {
    e.preventDefault()
    if (!email) { showToast('Vnesi email naslov.', 'error'); return }
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://prednost-termini.si/reset-gesla'
    })
    if (error) showToast(error.message, 'error')
    else showToast('Poslali smo ti email za ponastavitev gesla.')
    setResetLoading(false)
    setResetMode(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box" style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="/logo.png" style={{
          position: 'absolute',
          width: '110%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.04,
          filter: 'hue-rotate(200deg) brightness(0.8) saturate(3)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {!resetMode ? (
            <>
              <h1 style={{ fontWeight: 600 }}>Šola vožnje <span>Prednost</span></h1>
              <p>Prijavi se v sistem Šole vožnje Prednost.</p>
              <form onSubmit={login}>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tvoj@email.com" required />
                </div>
                <div className="form-field">
                  <label>Geslo</label>
                  <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" required />
                </div>
                <button className="btn-primary" disabled={loading}>{loading ? 'Prijavljam...' : 'Prijava'}</button>
              </form>
              <div className="auth-link" style={{ marginTop: 12 }}>
                <a onClick={() => setResetMode(true)} style={{ cursor: 'pointer' }}>Pozabljeno geslo?</a>
              </div>
              <div className="auth-link">
                Nimaš računa? <a onClick={onSwitch}>Registracija →</a>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontWeight: 600 }}>Ponastavi <span>geslo</span></h1>
              <p>Vnesi svoj email in poslali ti bomo povezavo za ponastavitev.</p>
              <form onSubmit={posljiReset}>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tvoj@email.com" required />
                </div>
                <button className="btn-primary" disabled={resetLoading}>
                  {resetLoading ? 'Pošiljam...' : 'Pošlji povezavo'}
                </button>
              </form>
              <div className="auth-link" style={{ marginTop: 12 }}>
                <a onClick={() => setResetMode(false)} style={{ cursor: 'pointer' }}>← Nazaj na prijavo</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}