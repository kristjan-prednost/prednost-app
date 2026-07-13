import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetGesla from './pages/ResetGesla'
import Nav from './components/Nav'
import Termini from './pages/Termini'
import Gradivo from './pages/Gradivo'
import Placila from './pages/Placila'
import Kviz from './pages/Kviz'
import Napredek from './pages/Napredek'
import Admin from './pages/Admin'
import NapredekAdmin from './pages/NapredekAdmin'
import Toast from './components/Toast'
import ObvestiloModal from './components/ObvestiloModal'

export default function App() {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [tab, setTab] = useState('termini')
  const [authView, setAuthView] = useState('login')
  const [toast, setToast] = useState({ msg: '', type: 'success', show: false })
  const [loading, setLoading] = useState(true)
  const jeResetStran = window.location.hash.includes('type=recovery')
  const [showObvestilo, setShowObvestilo] = useState(() => {
    const danes = new Date().toISOString().slice(0, 10)
    return localStorage.getItem('obvestilo_ukinitev_skrito') !== danes
  })

  function skrijObvestiloDanes() {
    const danes = new Date().toISOString().slice(0, 10)
    localStorage.setItem('obvestilo_ukinitev_skrito', danes)
    setShowObvestilo(false)
  }

  const loadProfil = useCallback(async (uid) => {
    const { data } = await supabase.from('profili').select('*').eq('id', uid).single()
    setProfil(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const isReset = window.location.hash.includes('type=recovery')

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session && !isReset) loadProfil(data.session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      const reset = window.location.hash.includes('type=recovery')
      setSession(s)
      if (s && !reset) loadProfil(s.user.id)
      else { setProfil(null); setLoading(false) }
    })
    return () => listener.subscription.unsubscribe()
  }, [loadProfil])

  function showToast(msg, type = 'success') {
    setToast({ msg, type, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3200)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'DM Mono', color: 'var(--muted)', fontSize: '0.85rem' }}>Nalaganje...</div>
    </div>
  )

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
      {showObvestilo && <ObvestiloModal onClose={() => setShowObvestilo(false)} onHideToday={skrijObvestiloDanes} />}
      <Toast {...toast} />
    </>
  )

  const isAdmin = profil?.vloga === 'admin'

  return (
    <>
      <Nav tab={tab} setTab={setTab} profil={profil} isAdmin={isAdmin} />
      {tab === 'termini' && <Termini profil={profil} showToast={showToast} />}
      {tab === 'gradivo' && <Gradivo />}
      {tab === 'placila' && <Placila />}
      {tab === 'kviz' && <Kviz showToast={showToast} />}
      {tab === 'napredek' && !isAdmin && <Napredek profil={profil} showToast={showToast} />}
      {tab === 'admin' && isAdmin && <Admin showToast={showToast} />}
      {tab === 'napredek-admin' && isAdmin && <NapredekAdmin showToast={showToast} />}
      {showObvestilo && <ObvestiloModal onClose={() => setShowObvestilo(false)} onHideToday={skrijObvestiloDanes} />}
      <Toast {...toast} />
    </>
  )
}