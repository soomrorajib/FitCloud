import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p>A cloud-based fitness and health management system. Plan workouts, track meals and measure real progress from anywhere.</p>
            <div className="socials" aria-label="Social media placeholders">
              <span><Facebook size={18} /></span><span><Instagram size={18} /></span>
              <span><Twitter size={18} /></span><span><Linkedin size={18} /></span>
            </div>
          </div>
          <div><h4>Product</h4><Link to="/features">Features</Link><Link to="/faq">FAQ</Link><Link to="/register">Get Started</Link></div>
          <div><h4>Company</h4><Link to="/about">About Us</Link><Link to="/contact">Contact Us</Link></div>
          <div><h4>Account</h4><Link to="/login">Login</Link><Link to="/register">Register</Link><Link to="/dashboard">Dashboard</Link></div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} FitCloud. Cloud Computing Open-Ended Lab project.</span>
          <span>React · Node.js · MongoDB Atlas · AWS</span>
        </div>
      </div>
    </footer>
  );
}
