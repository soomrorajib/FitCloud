import { useEffect, useRef, useState } from 'react';
import { Camera, Save, Mail, Calendar, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/apiServices';
import { getErrorMessage } from '../services/api';
import useForm from '../hooks/useForm';
import { Field } from '../components/FormField';
import { Spinner } from '../components/Feedback';
import { Avatar, PageHeader } from '../components/Widgets';
import { FITNESS_LEVELS, validateImage, validateProfile } from '../utils/validators';
import { formatDate } from '../utils/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const fileInput = useRef(null);
  const { values, errors, setErrors, handleChange } = useForm({ name: user.name, email: user.email, fitnessLevel: user.fitnessLevel });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handleFile = (event) => {
    const chosen = event.target.files[0];
    if (!chosen) return;
    const problem = validateImage(chosen);
    if (problem) { setErrors((p) => ({ ...p, profileImage: problem })); event.target.value = ''; return; }
    setErrors((p) => ({ ...p, profileImage: undefined }));
    setFile(chosen); setPreview(URL.createObjectURL(chosen));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateProfile(values, file);
    setErrors(found);
    if (Object.keys(found).length) return;

    const formData = new FormData();
    formData.append('name', values.name.trim());
    formData.append('email', values.email.trim());
    formData.append('fitnessLevel', values.fitnessLevel);
    if (file) formData.append('profileImage', file);

    setSaving(true); setServerError('');
    try {
      const response = await authService.updateProfile(formData);
      setUser(response.data);
      setFile(null); setPreview('');
      toast.success(response.message);
    } catch (error) {
      setServerError(getErrorMessage(error, 'Failed to update profile'));
    } finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Manage your personal details and photo." />
      <div className="profile-grid">
        <div className="card profile-card">
          {preview ? <div className="avatar lg"><img src={preview} alt="New profile preview" /></div> : <Avatar user={user} size="lg" />}
          <h3>{user.name}</h3>
          <span className="badge badge-green">{user.fitnessLevel}</span>
          <dl>
            <div><dt><Mail size={12} /> Email</dt><dd>{user.email}</dd></div>
            <div><dt><Award size={12} /> Fitness level</dt><dd>{user.fitnessLevel}</dd></div>
            <div><dt><Calendar size={12} /> Member since</dt><dd>{formatDate(user.createdAt)}</dd></div>
          </dl>
        </div>

        <form className="card" onSubmit={handleSubmit} noValidate>
          <div className="card-title"><h3>Edit profile</h3></div>
          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
          <div className="form-grid">
            <Field label="Full name" required error={errors.name}><input className={`input ${errors.name ? 'has-error' : ''}`} name="name" value={values.name} onChange={handleChange} /></Field>
            <Field label="Email" required error={errors.email}><input className={`input ${errors.email ? 'has-error' : ''}`} type="email" name="email" value={values.email} onChange={handleChange} /></Field>
            <Field label="Fitness level" error={errors.fitnessLevel}>
              <select className="select" name="fitnessLevel" value={values.fitnessLevel} onChange={handleChange}>{FITNESS_LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
            </Field>
            <Field label="Profile picture" error={errors.profileImage} hint="JPG, PNG or WEBP, up to 2 MB. Stored on AWS S3.">
              <div className="upload">
                <div className="preview-img">{preview ? <img src={preview} alt="" /> : <Camera size={24} />}</div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInput.current.click()}>{file ? 'Change photo' : 'Upload photo'}</button>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
              </div>
            </Field>
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? <Spinner small /> : <Save size={17} />} Save changes</button>
        </form>
      </div>
    </>
  );
}
