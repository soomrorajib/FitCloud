// Chhote reusable UI pieces: Badge, ProgressBar, StatCard, PageHeader, Avatar
import { initialsOf } from '../utils/format';

const TONES = {
  Strength: 'green', Cardio: 'orange', Yoga: 'purple', Flexibility: 'blue', HIIT: 'pink', Other: 'gray',
  'Not Started': 'gray', 'In Progress': 'blue', Completed: 'green',
  Breakfast: 'yellow', Lunch: 'green', Dinner: 'purple', Snack: 'orange',
};

export const Badge = ({ value }) => <span className={`badge badge-${TONES[value] || 'gray'}`}>{value}</span>;

export const ProgressBar = ({ value = 0, tone }) => (
  <div className="progress-row">
    <div className={`progress ${tone === 'orange' ? 'bar-orange' : ''}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
    <span>{Math.round(value)}%</span>
  </div>
);

export const StatCard = ({ icon: Icon, label, value, tone = 'green' }) => (
  <div className="stat-card">
    <div className={`stat-icon tone-${tone}`}><Icon size={22} /></div>
    <div><small>{label}</small><strong>{value}</strong></div>
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="page-header">
    <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    {action}
  </div>
);

export const Avatar = ({ user, size = '' }) => (
  <div className={`avatar ${size}`}>
    {user?.profileImage ? <img src={user.profileImage} alt={`${user.name} profile`} /> : initialsOf(user?.name)}
  </div>
);
