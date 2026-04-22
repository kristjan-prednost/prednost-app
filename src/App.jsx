import { useState, useEffect } from 'react'
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

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [tab, setTab] = useState('termini')
  const [authView, setAuthView] = useState('login')
  const [toast, setToast] = useState({ msg: '', type: 'success', show: false })
  const [loading, setLoading] = useState(true)
  const [jeResetStran, setJeResetStran] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => {
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

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted')
    }
  }, [])

  async function loadProfil(uid) {
    const { data } = await supabase.from('profili').select('*').eq('id', uid).single()
    setProfil(data)
    setLoading(false)
  }

  async function vklopiNotifikacije() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showToast('Tvoj brskalnik ne podpira push notifikacij.', 'error')
      return
    }
    setPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        showToast('Notifikacije so onemogočene v nastavitvah brskalnika.', 'error')
        setPushLoading(false)
        return
      }
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('push_subscriptions').upsert({
        kandidat_id: user.id,
        subscription: subscription.toJSON()
      }, { onConflict: 'kandidat_id' })
      setPushEnabled(true)
      showToast('Obvestila so vklopljena! 🔔')
    } catch(e) {
      console.error('Push napaka:', e)
      showToast('Napaka pri vklopu obvestil.', 'error')
    }
    setPushLoading(false)
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
      <Nav
        tab={tab} setTab={setTab} profil={profil} isAdmin={isAdmin}
        pushEnabled={pushEnabled} pushLoading={pushLoading}
        onPush={vklopiNotifikacije}
      />
      {tab === 'termini' && <Termini profil={profil} showToast={showToast} />}
      {tab === 'gradivo' && <Gradivo />}
      {tab === 'placila' && <Placila />}
      {tab === 'kviz' && <Kviz showToast={showToast} />}
      {tab === 'napredek' && !isAdmin && <Napredek profil={profil} showToast={showToast} />}
      {tab === 'admin' && isAdmin && <Admin showToast={showToast} />}
      {tab === 'napredek-admin' && isAdmin && <NapredekAdmin showToast={showToast} />}
      <Toast {...toast} />
    </>
  )
}