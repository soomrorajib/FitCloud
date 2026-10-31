import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, UserPlus, User } from 'lucide-react';
import Logo from '../components/Logo';
import { Field, PasswordInput } from '../components/FormField';
import { Spinner } from '../components/Feedback';
import useForm from '../hooks/useForm';
import { FITNESS_LEVELS, passwordStrength, validateImage, validateRegister } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

const STRENGTH_COLORS = ['#e2e8f0', '#ef4444', '#f59e0b', '#84cc16', '#10b981'];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const { values, errors, setErrors, handleChange } = useForm({ name: '', email: '', password: '', confirmPassword: '', fitnessLevel: 'Beginner' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Preview ka temporary URL saaf karna
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handleFile = (event) => {
    const chosen = event.target.files[0];
    if (!chosen) return;
    const problem = validateImage(chosen);
    if (problem) {
      setErrors((previous) => ({ ...previous, profileImage: problem }));
      setFile(null); setPreview('');
      event.target.value = '';
      return;
    }
    setErrors((previous) => ({ ...previous, profileImage: undefined }));
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateRegister(values, file);
    setErrors(found);
    if (Object.keys(found).length) return;

    // File bhi jaa rahi hai, isliye FormData (multipart/form-data)
    const formData = new FormData();
    formData.append('name', values.name.trim());
    formData.append('email', values.email.trim());
    formData.append('password', values.password);
    formData.append('confirmPassword', values.confirmPassword);
    formData.append('fitnessLevel', values.fitnessLevel);
    if (file) formData.append('profileImage', file);

    setSubmitting(true); setServerError('');
    try {
      const user = await register(formData);
      toast.success(`Registration successful. Welcome, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(values.password);

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Logo />
        <div>
          <h2>Start your fitness journey today.</h2>
          <ul>
            <li><CheckCircle2 size={20} /> Plan workouts and meals in one place</li>
            <li><CheckCircle2 size={20} /> Charts that show real progress</li>
            <li><CheckCircle2 size={20} /> Export your data anytime</li>
          </ul>
        </div>
        <small style={{ color: '#64748b' }}>© {new Date().getFullYear()} FitCloud</small>
      </aside>

      <main className="auth-main">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h1>Create account</h1>
          <p className="sub">It takes less than a minute.</p>
          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

          <Field label="Full name" required error={errors.name}>
            <input className={`input ${errors.name ? 'has-error' : ''}`} name="name" autoComplete="name" value={values.name} onChange={handleChange} placeholder="Your full name" />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input className={`input ${errors.email ? 'has-error' : ''}`} type="email" name="email" autoComplete="email" value={values.email} onChange={handleChange} placeholder="you@example.com" />
          </Field>
          <Field label="Password" required error={errors.password} hint="At least 8 characters with uppercase, lowercase and a number">
            <PasswordInput error={errors.password} name="password" autoComplete="new-password" value={values.password} onChange={handleChange} placeholder="Create a strong password" />
            {values.password && <div className="strength" aria-hidden="true">{[1, 2, 3, 4].map((n) => <i key={n} style={{ background: n <= strength ? STRENGTH_COLORS[strength] : undefined }} />)}</div>}
          </Field>
          <Field label="Confirm password" required error={errors.confirmPassword}>
            <PasswordInput error={errors.confirmPassword} name="confirmPassword" autoComplete="new-password" value={values.confirmPassword} onChange={handleChange} placeholder="Repeat your password" />
          </Field>
          <Field label="Fitness level" required error={errors.fitnessLevel}>
            <select className="select" name="fitnessLevel" value={values.fitnessLevel} onChange={handleChange}>
              {FITNESS_LEVELS.map((level) => <option key={level}>{level}</option>)}
            </select>
          </Field>
          <Field label="Profile picture" error={errors.profileImage} hint="Optional. JPG, PNG or WEBP, up to 2 MB.">
            <div className="upload">
              <div className="preview-img">{preview ? <img src={preview} alt="Selected profile preview" /> : <User size={28} />}</div>
              <div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInput.current.click()}><Camera size={15} /> {file ? 'Change photo' : 'Choose photo'}</button>
                {file && <div className="field-hint">{file.name}</div>}
              </div>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
            </div>
          </Field>

          <button className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? <Spinner small /> : <UserPlus size={18} />} Create account
          </button>
          <p className="auth-switch">Already have an account? <Link to="/login">Login</Link></p>
        </form>
      </main>
    </div>
  );
}
