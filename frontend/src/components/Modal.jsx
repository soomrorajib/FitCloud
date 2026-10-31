import { useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Spinner } from './Feedback';

export function Modal({ title, onClose, children, footer, small }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden'; // peeche ka page scroll na ho
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal ${small ? 'sm' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// Delete se pehle confirmation
export function ConfirmDialog({ title = 'Delete item?', message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Modal small title="Please confirm" onClose={onCancel}>
      <div className="text-center">
        <div className="confirm-icon"><Trash2 size={26} /></div>
        <h3>{title}</h3>
        <p className="text-muted">{message}</p>
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy && <Spinner small />} {confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
