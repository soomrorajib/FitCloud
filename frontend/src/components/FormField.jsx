import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && <label>{label}{required && <span className="req"> *</span>}</label>}
      {children}
      {error && <div className="field-error" role="alert"><AlertCircle size={14} />{error}</div>}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

export function PasswordInput({ error, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-wrap">
      <input className={`input ${error ? 'has-error' : ''}`} type={visible ? 'text' : 'password'} {...props} />
      <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
