import { useState } from 'react';
import { Activity, Plus, Search, Pencil, Trash2, Save, X, Timer } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useForm from '../hooks/useForm';
import { exerciseService } from '../services/apiServices';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingState, ErrorState, EmptyState, Spinner } from '../components/Feedback';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Field } from '../components/FormField';
import { Badge, PageHeader } from '../components/Widgets';
import { EXERCISE_TYPES, validateExercise } from '../utils/validators';

const emptyExercise = () => ({ name: '', type: 'Strength', duration: '', description: '' });

function ExerciseForm({ exercise, onClose, onSaved }) {
  const toast = useToast();
  const { values, errors, setErrors, handleChange } = useForm(exercise ? { ...exercise, description: exercise.description || '' } : emptyExercise());
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateExercise(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = { name: values.name.trim(), type: values.type, duration: Number(values.duration), description: values.description.trim() };
    setSaving(true); setServerError('');
    try {
      const response = exercise ? await exerciseService.update(exercise._id, payload) : await exerciseService.create(payload);
      toast.success(response.message);
      onSaved();
    } catch (error) {
      setServerError(getErrorMessage(error, 'Failed to save exercise'));
    } finally { setSaving(false); }
  };

  return (
    <Modal title={exercise ? 'Edit exercise' : 'Add exercise'} onClose={onClose}
      footer={<>
        <button className="btn btn-outline" type="button" onClick={onClose}><X size={16} /> Cancel</button>
        <button className="btn btn-primary" form="exercise-form" disabled={saving}>{saving ? <Spinner small /> : <Save size={16} />} {exercise ? 'Save changes' : 'Add exercise'}</button>
      </>}>
      <form id="exercise-form" onSubmit={handleSubmit} noValidate>
        {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
        <div className="form-grid">
          <Field label="Exercise name" required error={errors.name} className="full"><input className={`input ${errors.name ? 'has-error' : ''}`} name="name" value={values.name} onChange={handleChange} placeholder="e.g. Barbell squat" /></Field>
          <Field label="Exercise type" required error={errors.type}><select className="select" name="type" value={values.type} onChange={handleChange}>{EXERCISE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Duration (minutes)" required error={errors.duration}><input className={`input ${errors.duration ? 'has-error' : ''}`} type="number" min="1" name="duration" value={values.duration} onChange={handleChange} /></Field>
          <Field label="Description" className="full"><textarea className="textarea" name="description" rows={3} value={values.description} onChange={handleChange} /></Field>
        </div>
      </form>
    </Modal>
  );
}

export default function Exercises() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const debouncedSearch = useDebounce(search);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => exerciseService.list({ search: debouncedSearch || undefined, type: type || undefined }), [debouncedSearch, type], 'Failed to load exercises'
  );
  const exercises = data?.data || [];
  const hasFilters = Boolean(search || type);

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      const response = await exerciseService.remove(deleting._id);
      toast.success(response.message);
      setDeleting(null); reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to delete exercise')); }
    finally { setDeleteBusy(false); }
  };

  return (
    <>
      <PageHeader title="Exercise Management" subtitle="Your personal library of exercises."
        action={<button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Add exercise</button>} />

      <div className="toolbar">
        <div className="search-box"><Search size={18} /><input className="input" placeholder="Search exercises" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search exercises" /></div>
        <select className="select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type"><option value="">All types</option>{EXERCISE_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        {hasFilters && <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setType(''); }}>Clear filters</button>}
      </div>

      {loading && !data ? <LoadingState text="Loading exercises..." /> : error ? <ErrorState message={error} onRetry={reload} /> : exercises.length === 0 ? (
        <EmptyState icon={Activity} title={hasFilters ? 'No exercises match your filters' : 'No exercises yet'}
          text={hasFilters ? 'Try a different search or clear the filters.' : 'Add exercises to build your personal library.'}
          action={!hasFilters && <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Add exercise</button>} />
      ) : (
        <div className="exercise-grid fade-in">
          {exercises.map((e) => (
            <article key={e._id} className="card exercise-card">
              <div className="top"><Badge value={e.type} />
                <div className="row-actions">
                  <button className="icon-btn" onClick={() => setEditing(e)} aria-label={`Edit ${e.name}`}><Pencil size={16} /></button>
                  <button className="icon-btn danger" onClick={() => setDeleting(e)} aria-label={`Delete ${e.name}`}><Trash2 size={16} /></button>
                </div>
              </div>
              <h3>{e.name}</h3>
              <p>{e.description || 'No description added.'}</p>
              <div className="foot"><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Timer size={16} /> {e.duration} min</span></div>
            </article>
          ))}
        </div>
      )}

      {editing && <ExerciseForm exercise={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {deleting && <ConfirmDialog title="Delete this exercise?" message={`“${deleting.name}” will be permanently removed.`} busy={deleteBusy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </>
  );
}
