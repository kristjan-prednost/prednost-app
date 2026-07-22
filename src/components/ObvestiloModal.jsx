export default function ObvestiloModal({ onClose, onHideToday }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-badge">Pomembno obvestilo</div>
        <h2 className="modal-title">Aplikacija se ukinja</h2>
        <p className="modal-text">
          Ta aplikacija <strong>PREDNOST-TERMINI</strong> bo delovala do{' '}
          <strong>konca julija 2026</strong>.
        </p>
        <p className="modal-text">
          Z <strong>avgustom</strong> se aplikacija ukine in vsi zbrani podatki
          (računi, termini, napredek, plačila) bodo <strong>trajno izbrisani</strong>.
        </p>
        <p className="modal-text">
          Od avgusta dalje bomo delo nadaljevali na novi aplikaciji{' '}
          <strong>mojučiteljvožnje.si</strong>. Prosim če si naredite račun na novi aplikaciji ter izberete mene kot učitelja vožnje. Hvala za razumevanje!
        </p>
        <button className="btn-primary" onClick={onClose}>
          Razumem
        </button>
        {onHideToday && (
          <button className="modal-hide-today" onClick={onHideToday}>
            Ne prikaži več danes
          </button>
        )}
      </div>
    </div>
  )
}
