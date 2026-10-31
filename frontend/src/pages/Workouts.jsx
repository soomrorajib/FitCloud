import { useState } from 'react';
import { Dumbbell, Plus, Search, Pencil, Trash2, Save, X } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useForm from '../hooks/useForm';
import { workoutService } from '../services/apiServices';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingState, ErrorState, EmptyState, Spinner } from '../components/Feedback';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Field } from '../components/FormField';
import { Badge, PageHeader, ProgressBar, StatCard } from '../components/Widgets';
import { WORKOUT_STATUSES, WORKOUT_TYPES, validateWorkout } from '../utils/validators';
import { formatDate, toInputDate, todayInput } from '../utils/format';
import { CheckCircle2, Target, CircleDashed } from 'lucide-react';

const emptyWorkout = () => ({ planName: '', description: '', type: 'Strength', duration: '', goal: '', status: 'Not Started', progress: 0, date: todayInput() });

function WorkoutForm({ workout, onClose, onSaved }) {
  const toast = useToast();
  const { values, errors, setErrors, setField, handleChange } = useForm(
    workout ? { ...workout, date: toInputDate(workout.date), goal: workout.goal || '', description: workout.description || '' } : emptyWorkout()
  );
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  // Status aur progress ek dusre se match rakhte hain (backend bhi yehi karta hai)
  const changeStatus = (event) => {
    const status = event.target.value;
    setField('status', status);
    if (status === 'Completed') setField('progress', 100);
    if (status === 'Not Started') setField('progress', 0);
  };
  const changeProgress = (event) => {
    const progress = Number(event.target.value);
    setField('progress', progress);
    if (progress === 100) setField('status', 'Completed');
    else if (progress > 0 && values.status !== 'In Progress') setField('status', 'In Progress');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateWorkout(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      planName: values.planName.trim(), description: values.description.trim(), type: values.type,
      duration: Number(values.duration), goal: values.goal.trim(), status: values.status,
      progress: Number(values.progress), date: values.date,
    };
    setSaving(true); setServerError('');
    try {
      const response = workout ? await workoutService.update(workout._id, payload) : await workoutService.create(payload);
      toast.success(response.message);
      onSaved();
    } catch (error) {
      setServerError(getErrorMessage(error, 'Failed to save workout'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={workout ? 'Edit workout' : 'Add workout'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose} type="button"><X size={16} /> Cancel</button>
        <button className="btn btn-primary" form="workout-form" disabled={saving}>{saving ? <Spinner small /> : <Save size={16} />} {workout ? 'Save changes' : 'Add workout'}</button>
      </>}
    >
      <form id="workout-form" onSubmit={handleSubmit} noValidate>
        {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
        <div className="form-grid">
          <Field label="Plan name" required error={errors.planName} className="full"><input className={`input ${errors.planName ? 'has-error' : ''}`} name="planName" value={values.planName} onChange={handleChange} placeholder="e.g. Full body strength" /></Field>
          <Field label="Workout type" required error={errors.type}>
            <select className="select" name="type" value={values.type} onChange={handleChange}>{WORKOUT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Duration (minutes)" required error={errors.duration}><input className={`input ${errors.duration ? 'has-error' : ''}`} type="number" min="1" name="duration" value={values.duration} onChange={handleChange} /></Field>
          <Field label="Goal" className="full"><input className="input" name="goal" value={values.goal} onChange={handleChange} placeholder="e.g. Build muscle" /></Field>
          <Field label="Description" className="full"><textarea className="textarea" name="description" rows={3} value={values.description} onChange={handleChange} /></Field>
          <Field label="Status" error={errors.status}>
            <select className="select" name="status" value={values.status} onChange={changeStatus}>{WORKOUT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </Field>
          <Field label="Date" required error={errors.date}><input className={`input ${errors.date ? 'has-error' : ''}`} type="date" name="date" value={values.date} onChange={handleChange} /></Field>
          <Field label={`Progress: ${values.progress}%`} error={errors.progress} className="full">
            <input className="range" type="range" min="0" max="100" step="5" value={values.progress} onChange={changeProgress} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export default function Workouts() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search);
  const [editing, setEditing] = useState(null); // null = band, {} = naya, workout = edit
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => workoutService.list({ search: debouncedSearch || undefined, type: type || undefined, status: status || undefined }),
    [debouncedSearch, type, status], 'Failed to load workouts'
  );
  const workouts = data?.data || [];
  const hasFilters = Boolean(search || type || status);
  const count = (s) => workouts.filter((w) => w.status === s).length;

  const changeStatus = async (workout, newStatus) => {
    try {
      await workoutService.update(workout._id, { status: newStatus });
      toast.success('Workout status updated');
      reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to update status')); }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      const response = await workoutService.remove(deleting._id);
      toast.success(response.message);
      setDeleting(null); reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to delete workout')); }
    finally { setDeleteBusy(false); }
  };

  return (
    <>
      <PageHeader title="Workout Plans" subtitle="Plan, track and complete your workouts."
        action={<button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Add workout</button>} />

      <div className="stats-grid four">
        <StatCard icon={Dumbbell} label="Shown" value={workouts.length} tone="green" />
        <StatCard icon={CircleDashed} label="Not started" value={count('Not Started')} tone="yellow" />
        <StatCard icon={Target} label="In progress" value={count('In Progress')} tone="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={count('Completed')} tone="orange" />
      </div>

      <div className="toolbar">
        <div className="search-box"><Search size={18} /><input className="input" placeholder="Search by plan name" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search workouts" /></div>
        <select className="select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type"><option value="">All types</option>{WORKOUT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{WORKOUT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        {hasFilters && <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setType(''); setStatus(''); }}>Clear filters</button>}
      </div>

      {loading && !data ? <LoadingState text="Loading workouts..." /> : error ? <ErrorState message={error} onRetry={reload} /> : workouts.length === 0 ? (
        <EmptyState icon={Dumbbell} title={hasFilters ? 'No workouts match your filters' : 'No workouts yet'}
          text={hasFilters ? 'Try a different search or clear the filters.' : 'Create your first workout plan to start tracking.'}
          action={!hasFilters && <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Add workout</button>} />
      ) : (
        <div className="table-wrap fade-in">
          <table className="table">
            <thead><tr><th>Plan</th><th>Type</th><th>Duration</th><th>Date</th><th>Status</th><th>Progress</th><th /></tr></thead>
            <tbody>
              {workouts.map((w) => (
                <tr key={w._id}>
                  <td><div className="name">{w.planName}</div><div className="desc">{w.goal || w.description || '-'}</div></td>
                  <td><Badge value={w.type} /></td>
                  <td>{w.duration} min</td>
                  <td>{formatDate(w.date)}</td>
                  <td>
                    <select className="status-select" value={w.status} onChange={(e) => changeStatus(w, e.target.value)} aria-label={`Status of ${w.planName}`}>
                      {WORKOUT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ minWidth: 150 }}><ProgressBar value={w.progress} /></td>
                  <td><div className="row-actions">
                    <button className="icon-btn" onClick={() => setEditing(w)} aria-label={`Edit ${w.planName}`}><Pencil size={16} /></button>
                    <button className="icon-btn danger" onClick={() => setDeleting(w)} aria-label={`Delete ${w.planName}`}><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <WorkoutForm workout={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {deleting && <ConfirmDialog title="Delete this workout?" message={`“${deleting.planName}” will be permanently removed.`} busy={deleteBusy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </>
  );
}
