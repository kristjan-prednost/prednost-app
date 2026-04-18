import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import './App.css'
import Termini from './Termini'
import Admin from './Admin'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

function App() {
  const [zavihek, setZavihek] = useState('booking')
  const [uporabnik, setUporabnik] = useState(null)
  const [profil, setProfil] = useState(null)
  const [nalaga, setNalaga] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

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

  useEffect(() => {
    // Preveri ali so push notifikacije že vklopljene
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted')
    }
  }, [])

  async function naložiProfil(uid) {
    const { data } = await supabase.from('profili').select('*').eq('id', uid).single()
    const { data: { user } } = await supabase.auth.getUser()
    setProfil(data)
    setNalaga(false)
  }

  async function vklopiNotifikacije() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tvoj brskalnik ne podpira push notifikacij.')
      return
    }

    setPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Notifikacije so onemogočene. Dovoli jih v nastavitvah brskalnika.')
        setPushLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      // Shrani subscription v Supabase
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('push_subscriptions').upsert({
        kandidat_id: user.id,
        subscription: subscription.toJSON()
      }, { onConflict: 'kandidat_id' })

      setPushEnabled(true)
    } catch(e) {
      console.error('Push napaka:', e)
      alert('Napaka pri vklopu notifikacij: ' + e.message)
    }
    setPushLoading(false)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!pushEnabled && profil?.vloga !== 'admin' && (
            <button
              onClick={vklopiNotifikacije}
              disabled={pushLoading}
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.4)',
                borderRadius: 8,
                padding: '6px 12px',
                color: '#60a5fa',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              {pushLoading ? '...' : '🔔 Vklopi obvestila'}
            </button>
          )}
          <button className="odjava-gumb" onClick={odjava}>Odjava</button>
        </div>
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
        {zavihek === 'booking' && <Termini profil={profil} />}
        {zavihek === 'gradivo' && <div><h2>Gradivo</h2><p>Kmalu...</p></div>}
        {zavihek === 'posnetki' && <div><h2>Posnetki</h2><p>Kmalu...</p></div>}
        {zavihek === 'kviz' && <div><h2>Kviz</h2><p>Kmalu...</p></div>}
        {zavihek === 'admin' && profil?.vloga === 'admin' && <Admin />}
      </main>
    </div>
  )
}

export default App