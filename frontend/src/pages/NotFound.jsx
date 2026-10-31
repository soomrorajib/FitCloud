import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found">
      <div>
        <h1>404</h1>
        <h2>Page not found</h2>
        <p className="text-muted">The page you are looking for does not exist or was moved.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </div>
  );
}
