import { supabase } from '../supabase'

export default function Nav({ tab, setTab, profil, isAdmin, pushEnabled, pushLoading, onPush }) {
  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <nav>
      <div className="logo">
        <span className="logo-main">ŠOLA VOŽNJE </span>
        <span className="logo-accent">PREDNOST</span>
      </div>
      <div className="nav-tabs">
        <button className={`nav-tab ${tab === 'termini' ? 'active' : ''}`} onClick={() => setTab('termini')}>
          Termini
        </button>
        <button className={`nav-tab ${tab === 'gradivo' ? 'active' : ''}`} onClick={() => setTab('gradivo')}>
          Gradivo
        </button>
        <button className={`nav-tab ${tab === 'placila' ? 'active' : ''}`} onClick={() => setTab('placila')}>
          Plačila
        </button>
        <button className={`nav-tab ${tab === 'kviz' ? 'active' : ''}`} onClick={() => setTab('kviz')}>
          Kviz
        </button>
        {!isAdmin && (
          <button className={`nav-tab ${tab === 'napredek' ? 'active' : ''}`} onClick={() => setTab('napredek')}>
            Napredek
          </button>
        )}
        {isAdmin && (
          <button className={`nav-tab ${tab === 'napredek-admin' ? 'active' : ''}`} onClick={() => setTab('napredek-admin')}>
            Napredek
          </button>
        )}
        {isAdmin && (
          <button className={`nav-tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>
            Admin
          </button>
        )}
      </div>
      <div className="nav-right">
        {!isAdmin && !pushEnabled && (
          <button
            onClick={onPush}
            disabled={pushLoading}
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.4)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#60a5fa',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap'
            }}
          >
            {pushLoading ? '...' : '🔔 Obvestila'}
          </button>
        )}
        <span className="nav-user">{profil?.ime} {profil?.priimek}</span>
        <button className="btn-logout" onClick={logout}>Odjava</button>
      </div>
    </nav>
  )
}