import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import './App.css'

function App() {
  const [zavihek, setZavihek] = useState('booking')
  const [uporabnik, setUporabnik] = useState(null)
  const [profil, setProfil] = useState(null)
  const [nalaga, setNalaga] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUporabnik(session?.user ?? null)
      if (session?.user) naložiProfil(session.user.id)
      else setNalaga(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUporabnik(session?.user ?? null)
      if (session?.user) naložiProfil(session.user.id)
      else { setProfil(null); setNalaga(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function naložiProfil(uid) {
    const { data } = await supabase
      .from('profili')
      .select('*')
      .eq('id', uid)
      .single()
    setProfil(data)
    setNalaga(false)
  }

  async function odjava() {
    await supabase.auth.signOut()
  }

  if (nalaga) return <div className="nalaga">Nalaganje...</div>
  if (!uporabnik) return <Auth />

  return (
    <div className="app">
      <header>
        <h1>
          <span className="sola">Šola vožnje </span>
          <span className="prednost">Prednost</span>
        </h1>
        <button className="odjava-gumb" onClick={odjava}>Odjava</button>
      </header>

      <nav>
        <button onClick={() => setZavihek('booking')} className={zavihek === 'booking' ? 'aktiven' : ''}>
          📅 Termini
        </button>
        <button onClick={() => setZavihek('gradivo')} className={zavihek === 'gradivo' ? 'aktiven' : ''}>
          📚 Gradivo
        </button>
        <button onClick={() => setZavihek('posnetki')} className={zavihek === 'posnetki' ? 'aktiven' : ''}>
          🎬 Posnetki
        </button>
        <button onClick={() => setZavihek('kviz')} className={zavihek === 'kviz' ? 'aktiven' : ''}>
          📝 Kviz
        </button>
        {profil?.vloga === 'admin' && (
          <button onClick={() => setZavihek('admin')} className={zavihek === 'admin' ? 'aktiven' : ''}>
            ⚙️ Admin
          </button>
        )}
      </nav>

      <main>
        {zavihek === 'booking' && <div><h2>Rezervacija terminov</h2><p>Kmalu...</p></div>}
        {zavihek === 'gradivo' && <div><h2>Gradivo</h2><p>Kmalu...</p></div>}
        {zavihek === 'posnetki' && <div><h2>Posnetki</h2><p>Kmalu...</p></div>}
        {zavihek === 'kviz' && <div><h2>Kviz</h2><p>Kmalu...</p></div>}
        {zavihek === 'admin' && profil?.vloga === 'admin' && (
          <div><h2>Admin</h2><p>Tukaj bo nadzorna plošča.</p></div>
        )}
      </main>
    </div>
  )
}

export default App