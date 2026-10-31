// Loading, empty aur error states. Koi bhi API page blank nahi dikhna chahiye.
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';

export const Spinner = ({ small }) => <span className={`spinner ${small ? 'sm' : ''}`} role="status" aria-label="Loading" />;

export const PageLoader = () => (
  <div className="page-loader"><Spinner /></div>
);

export const LoadingState = ({ text = 'Loading...' }) => (
  <div className="loading-box"><Spinner /><span>{text}</span></div>
);

export const EmptyState = ({ icon: Icon = Inbox, title, text, action }) => (
  <div className="state-box fade-in">
    <div className="state-icon"><Icon size={30} /></div>
    <h3>{title}</h3>
    <p>{text}</p>
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="state-box error fade-in" role="alert">
    <div className="state-icon"><AlertTriangle size={30} /></div>
    <h3>Something went wrong</h3>
    <p>{message}</p>
    {onRetry && <button className="btn btn-outline" onClick={onRetry}><RefreshCw size={16} /> Try again</button>}
  </div>
);
