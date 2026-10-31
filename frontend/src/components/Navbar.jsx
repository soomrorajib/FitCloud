import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/features', label: 'Features' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Logo />
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
        <div className={`nav-menu ${open ? 'open' : ''}`}>
          <nav className="nav-links" aria-label="Main">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} onClick={close} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm" onClick={close}>Hi, {user.name.split(' ')[0]} · Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost-light btn-sm" onClick={close}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
