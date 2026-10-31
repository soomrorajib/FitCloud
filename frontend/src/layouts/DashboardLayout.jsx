import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Logo from '../components/Logo';
import { Avatar } from '../components/Widgets';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="app">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className={`overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <div className="main">
        <div className="topbar">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <Logo to="/dashboard" />
          <Avatar user={user} />
        </div>
        <div className="content fade-in"><Outlet /></div>
      </div>
    </div>
  );
}
