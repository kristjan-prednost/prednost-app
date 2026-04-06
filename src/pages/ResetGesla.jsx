import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ResetGesla({ showToast }) {
  const [geslo, setGeslo] = useState('')
  const [geslo2, setGeslo2] = useState('')
  const [loading, setLoading] = useState(false)
  const [uspeh, setUspeh] = useState(false)
  const [veljavna, setVeljavna] = useState(false)

  useEffect(() => {
    // Supabase ob kliku na link v emailu nastavi session avtomatsko
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setVeljavna(true)
    })
  }, [])

  async function spremiGeslo(e) {
    e.preventDefault()
    if (geslo.length < 6) { showToast('Geslo mora biti vsaj 6 znakov.', 'error'); return }
    if (geslo !== geslo2) { showToast('Gesli se ne ujemata.', 'error'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: geslo })
    if (error) showToast(error.message, 'error')
    else setUspeh(true)
    setLoading(false)
  }

  if (!veljavna) {
    return (
      <div className="auth-wrap">
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontWeight: 600 }}>Neveljavna <span>povezava</span></h1>
          <p style={{ color: 'var(--muted)' }}>Ta povezava je potekla ali je neveljavna. Zahtevaj novo ponastavitev gesla.</p>
        </div>
      </div>
    )
  }

  if (uspeh) {
    return (
      <div className="auth-wrap">
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h1 style={{ fontWeight: 600 }}>Geslo <span>spremenjeno</span></h1>
          <p style={{ color: 'var(--muted)' }}>Tvoje geslo je bilo uspešno posodobljeno. Zdaj se lahko prijaviš.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <h1 style={{ fontWeight: 600 }}>Novo <span>geslo</span></h1>
        <p>Vnesi novo geslo za tvoj račun.</p>
        <form onSubmit={spremiGeslo}>
          <div className="form-field">
            <label>Novo geslo</label>
            <input type="password" value={geslo} onChange={e => setGeslo(e.target.value)} placeholder="Min. 6 znakov" required />
          </div>
          <div className="form-field">
            <label>Ponovi geslo</label>
            <input type="password" value={geslo2} onChange={e => setGeslo2(e.target.value)} placeholder="Ponovi geslo" required />
          </div>
          <button className="btn-primary" disabled={loading}>
            {loading ? 'Shranjujem...' : 'Shrani geslo'}
          </button>
        </form>
      </div>
    </div>
  )
}