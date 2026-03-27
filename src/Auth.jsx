import { useState } from 'react'
import { supabase } from './supabase'

function Auth() {
  const [nacin, setNacin] = useState('prijava') // 'prijava' ali 'registracija'
  const [email, setEmail] = useState('')
  const [geslo, setGeslo] = useState('')
  const [ime, setIme] = useState('')
  const [napaka, setNapaka] = useState('')
  const [nalaga, setNalaga] = useState(false)

  async function handleSubmit() {
    setNapaka('')
    setNalaga(true)

    if (nacin === 'registracija') {
      const { error } = await supabase.auth.signUp({
        email,
        password: geslo,
        options: { data: { ime } }
      })
      if (error) setNapaka(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: geslo
      })
      if (error) setNapaka('Napačen email ali geslo')
    }

    setNalaga(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">
          <span className="sola">Šola vožnje </span>
          <span className="prednost">Prednost</span>
        </h1>

        <div className="auth-tabs">
          <button
            className={nacin === 'prijava' ? 'aktiven' : ''}
            onClick={() => setNacin('prijava')}
          >
            Prijava
          </button>
          <button
            className={nacin === 'registracija' ? 'aktiven' : ''}
            onClick={() => setNacin('registracija')}
          >
            Registracija
          </button>
        </div>

        {nacin === 'registracija' && (
          <div className="auth-field">
            <label>Ime in priimek</label>
            <input
              type="text"
              placeholder="npr. Ana Novak"
              value={ime}
              onChange={e => setIme(e.target.value)}
            />
          </div>
        )}

        <div className="auth-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="tvoj@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label>Geslo</label>
          <input
            type="password"
            placeholder="••••••••"
            value={geslo}
            onChange={e => setGeslo(e.target.value)}
          />
        </div>

        {napaka && <p className="auth-napaka">{napaka}</p>}

        <button
          className="auth-gumb"
          onClick={handleSubmit}
          disabled={nalaga}
        >
          {nalaga ? 'Počakaj...' : nacin === 'prijava' ? 'Prijava' : 'Registracija'}
        </button>
      </div>
    </div>
  )
}

export default Auth