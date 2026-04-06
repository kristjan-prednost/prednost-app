import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetGesla from './pages/ResetGesla'
import Nav from './components/Nav'
import Termini from './pages/Termini'
import Gradivo from './pages/Gradivo'
import Kviz from './pages/Kviz'
import Napredek from './pages/Napredek'
import Admin from './pages/Admin'
import NapredekAdmin from './pages/NapredekAdmin'
import Toast from './components/Toast'

export default function App() {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [tab, setTab] = useState('termini')
  const [authView, setAuthView] = useState('login')
  const [toast, setToast] = useState({ msg: '', type: 'success', show: false })
  const [loading, setLoading] = useState(true)
  const [jeResetStran, setJeResetStran] = useState(false)

  useEffect(() => {
    // Preveri če je to reset-gesla stran (Supabase doda #access_token v URL)
    const hash = window.location.hash
    const isReset = hash.includes('type=recovery')
    setJeResetStran(isReset)

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session && !isReset) loadProfil(data.session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s && !jeResetStran) loadProfil(s.user.id)
      else { setProfil(null); setLoading(false) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadProfil(uid) {
    const { data } = await supabase.from('profili').select('*').eq('id', uid).single()
    setProfil(data)
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3200)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'DM Mono', color: 'var(--muted)', fontSize: '0.85rem' }}>Nalaganje...</div>
    </div>
  )

  // Reset gesla stran
  if (jeResetStran) return (
    <>
      <ResetGesla showToast={showToast} />
      <Toast {...toast} />
    </>
  )

  if (!session) return (
    <>
      {authView === 'login'
        ? <Login onSwitch={() => setAuthView('register')} showToast={showToast} />
        : <Register onSwitch={() => setAuthView('login')} showToast={showToast} />}
      <Toast {...toast} />
    </>
  )

  const isAdmin = profil?.vloga === 'admin'

  return (
    <>
      <Nav tab={tab} setTab={setTab} profil={profil} isAdmin={isAdmin} />
      {tab === 'termini' && <Termini profil={profil} showToast={showToast} />}
      {tab === 'gradivo' && <Gradivo />}
      {tab === 'kviz' && <Kviz showToast={showToast} />}
      {tab === 'napredek' && !isAdmin && <Napredek profil={profil} showToast={showToast} />}
      {tab === 'admin' && isAdmin && <Admin showToast={showToast} />}
      {tab === 'napredek-admin' && isAdmin && <NapredekAdmin showToast={showToast} />}
      <Toast {...toast} />
    </>
  )
}