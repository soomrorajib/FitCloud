import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, LogIn } from 'lucide-react';
import Logo from '../components/Logo';
import { Field, PasswordInput } from '../components/FormField';
import { Spinner } from '../components/Feedback';
import useForm from '../hooks/useForm';
import { validateLogin } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { values, errors, setErrors, handleChange } = useForm({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true); setServerError('');
    try {
      const user = await login({ email: values.email.trim(), password: values.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, 'Login failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Logo />
        <div>
          <h2>Welcome back to your fitness cloud.</h2>
          <ul>
            <li><CheckCircle2 size={20} /> Pick up exactly where you left off</li>
            <li><CheckCircle2 size={20} /> See today’s workout and meals</li>
            <li><CheckCircle2 size={20} /> Your data stays private to you</li>
          </ul>
        </div>
        <small style={{ color: '#64748b' }}>© {new Date().getFullYear()} FitCloud</small>
      </aside>

      <main className="auth-main">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h1>Login</h1>
          <p className="sub">Enter your email and password to continue.</p>
          {location.state?.from && <div className="alert alert-info">Please login to open that page.</div>}
          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
          <Field label="Email" error={errors.email}>
            <input className={`input ${errors.email ? 'has-error' : ''}`} type="email" name="email" autoComplete="email" value={values.email} onChange={handleChange} placeholder="you@example.com" />
          </Field>
          <Field label="Password" error={errors.password}>
            <PasswordInput error={errors.password} name="password" autoComplete="current-password" value={values.password} onChange={handleChange} placeholder="Your password" />
          </Field>
          <button className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? <Spinner small /> : <LogIn size={18} />} Login
          </button>
          <p className="auth-switch">New to FitCloud? <Link to="/register">Create an account</Link></p>
        </form>
      </main>
    </div>
  );
}
