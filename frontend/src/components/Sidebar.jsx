import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Dumbbell, Utensils, Activity, TrendingUp, FileDown, UserRound, Mail, LogOut } from 'lucide-react';
import Logo from './Logo';
import { Avatar } from './Widgets';
import { useAuth } from '../context/AuthContext';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workouts', label: 'Workout Plans', icon: Dumbbell },
  { to: '/diet', label: 'Diet Plans', icon: Utensils },
  { to: '/exercises', label: 'Exercises', icon: Activity },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/reports', label: 'Reports', icon: FileDown },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/contact', label: 'Contact Us', icon: Mail },
];

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Sidebar">
      <Logo to="/dashboard" />
      <nav className="side-nav">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
            <Icon size={20} /> {label}
          </NavLink>
        ))}
        <button className="side-link" onClick={handleLogout}><LogOut size={20} /> Logout</button>
      </nav>
      <div className="side-user">
        <Avatar user={user} />
        <div><strong>{user?.name}</strong><small>{user?.fitnessLevel}</small></div>
      </div>
    </aside>
  );
}
