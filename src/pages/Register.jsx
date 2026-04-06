import { useState } from 'react'
import { supabase } from '../supabase'

export default function Register({ onSwitch, showToast }) {
  const [form, setForm] = useState({ ime: '', priimek: '', email: '', pw: '' })
  const [loading, setLoading] = useState(false)
  const [cakaNaVerifikacijo, setCakaNaVerifikacijo] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function register(e) {
    e.preventDefault()
    if (form.pw.length < 6) { showToast('Geslo mora biti vsaj 6 znakov.', 'error'); return }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.pw,
      options: {
        data: { ime: form.ime, priimek: form.priimek },
        emailRedirectTo: 'https://prednost-termini.si'
      }
    })

    if (error) {
      showToast(error.message, 'error')
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profili').upsert({
        id: data.user.id,
        ime: form.ime,
        priimek: form.priimek,
        email: form.email,
        vloga: 'kandidat'
      }, { onConflict: 'id' })
    }

    setLoading(false)
    setCakaNaVerifikacijo(true)
  }

  if (cakaNaVerifikacijo) {
    return (
      <div className="auth-wrap">
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontWeight: 600, marginBottom: 12 }}>Preveri <span>email</span></h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Poslali smo ti potrditveni email na<br />
            <strong style={{ color: 'var(--text)' }}>{form.email}</strong>
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Klikni na povezavo v emailu da aktiviraš račun. Po aktivaciji se lahko prijaviš.
          </p>
          <div className="auth-link" style={{ marginTop: 24 }}>
            <a onClick={onSwitch} style={{ cursor: 'pointer' }}>Pojdi na prijavo →</a>
          </div>
        </div>
      </div>
    )
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
          <h1 style={{ fontWeight: 600 }}>Ustvari<span>račun</span></h1>
          <p>Registriraj se in rezerviraj termine vožnje.</p>
          <form onSubmit={register}>
            <div className="field-row">
              <div className="form-field">
                <label>Ime</label>
                <input value={form.ime} onChange={e => set('ime', e.target.value)} placeholder="Ana" required />
              </div>
              <div className="form-field">
                <label>Priimek</label>
                <input value={form.priimek} onChange={e => set('priimek', e.target.value)} placeholder="Novak" required />
              </div>
            </div>
            <div className="form-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tvoj@email.com" required />
            </div>
            <div className="form-field">
              <label>Geslo</label>
              <input type="password" value={form.pw} onChange={e => set('pw', e.target.value)} placeholder="Min. 6 znakov" required />
            </div>
            <button className="btn-primary" disabled={loading}>{loading ? 'Registriram...' : 'Registracija'}</button>
          </form>
          <div className="auth-link">
            Že imaš račun? <a onClick={onSwitch}>Prijava →</a>
          </div>
        </div>
      </div>
    </div>
  )
}