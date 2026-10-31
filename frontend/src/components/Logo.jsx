import { Link } from 'react-router-dom';
import { Cloud } from 'lucide-react';

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="FitCloud home">
      <span className="logo-mark"><Cloud size={20} strokeWidth={2.4} /></span>
      <span>Fit<b>Cloud</b></span>
    </Link>
  );
}
