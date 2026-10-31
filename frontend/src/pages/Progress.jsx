import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Plus, Pencil, Trash2, Save, X, Scale, Dumbbell, Percent, Flame } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import useForm from '../hooks/useForm';
import { progressService } from '../services/apiServices';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingState, ErrorState, EmptyState, Spinner } from '../components/Feedback';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Field } from '../components/FormField';
import { PageHeader, ProgressBar, StatCard } from '../components/Widgets';
import { validateProgress } from '../utils/validators';
import { formatDate, formatNumber, formatShortDate, toInputDate, todayInput } from '../utils/format';

const emptyEntry = () => ({ weight: '', workoutCompleted: 0, calories: 0, progressPercentage: 0, date: todayInput() });

function ProgressForm({ entry, onClose, onSaved }) {
  const toast = useToast();
  const { values, errors, setErrors, handleChange } = useForm(entry ? { ...entry, date: toInputDate(entry.date) } : emptyEntry());
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateProgress(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      weight: Number(values.weight), workoutCompleted: Number(values.workoutCompleted),
      calories: Number(values.calories), progressPercentage: Number(values.progressPercentage), date: values.date,
    };
    setSaving(true); setServerError('');
    try {
      const response = entry ? await progressService.update(entry._id, payload) : await progressService.create(payload);
      toast.success(response.message);
      onSaved();
    } catch (error) {
      setServerError(getErrorMessage(error, 'Failed to save progress'));
    } finally { setSaving(false); }
  };

  return (
    <Modal title={entry ? 'Edit progress' : 'Record progress'} onClose={onClose}
      footer={<>
        <button className="btn btn-outline" type="button" onClick={onClose}><X size={16} /> Cancel</button>
        <button className="btn btn-primary" form="progress-form" disabled={saving}>{saving ? <Spinner small /> : <Save size={16} />} {entry ? 'Save changes' : 'Save entry'}</button>
      </>}>
      <form id="progress-form" onSubmit={handleSubmit} noValidate>
        {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
        <div className="form-grid">
          <Field label="Weight (kg)" required error={errors.weight}><input className={`input ${errors.weight ? 'has-error' : ''}`} type="number" step="0.1" min="0.1" name="weight" value={values.weight} onChange={handleChange} /></Field>
          <Field label="Date" required error={errors.date}><input className={`input ${errors.date ? 'has-error' : ''}`} type="date" name="date" value={values.date} onChange={handleChange} /></Field>
          <Field label="Workouts completed" error={errors.workoutCompleted}><input className={`input ${errors.workoutCompleted ? 'has-error' : ''}`} type="number" min="0" name="workoutCompleted" value={values.workoutCompleted} onChange={handleChange} /></Field>
          <Field label="Calories (kcal)" error={errors.calories}><input className={`input ${errors.calories ? 'has-error' : ''}`} type="number" min="0" name="calories" value={values.calories} onChange={handleChange} /></Field>
          <Field label={`Progress: ${values.progressPercentage}%`} error={errors.progressPercentage} className="full">
            <input className="range" type="range" min="0" max="100" step="1" name="progressPercentage" value={values.progressPercentage} onChange={handleChange} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

const ChartCard = ({ title, children }) => (
  <div className="card"><div className="card-title"><h3>{title}</h3></div><div className="chart-box"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>
);

export default function Progress() {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Charts ke liye purane se naye order mein
  const { data, loading, error, reload } = useFetch(() => progressService.list({ sort: 'asc' }), [], 'Failed to load progress');
  const entries = data?.data || [];
  const chartData = entries.map((e) => ({ ...e, label: formatShortDate(e.date) }));
  const latest = entries[entries.length - 1];
  const first = entries[0];
  const average = entries.length ? Math.round(entries.reduce((s, e) => s + e.progressPercentage, 0) / entries.length) : 0;
  const change = latest && first ? (latest.weight - first.weight).toFixed(1) : 0;

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      const response = await progressService.remove(deleting._id);
      toast.success(response.message);
      setDeleting(null); reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to delete entry')); }
    finally { setDeleteBusy(false); }
  };

  const axes = (unit, width = 48) => (<>
    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
    <YAxis tick={{ fontSize: 12 }} unit={unit} width={width} domain={unit === ' kg' ? ['dataMin - 1', 'dataMax + 1'] : undefined} />
  </>);

  return (
    <>
      <PageHeader title="Progress Tracking" subtitle="Record how you are doing and watch the trend."
        action={<button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Record progress</button>} />

      {loading && !data ? <LoadingState text="Loading progress..." /> : error ? <ErrorState message={error} onRetry={reload} /> : entries.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No progress recorded yet" text="Add your first entry (weight, workouts, calories and progress) to unlock the charts."
          action={<button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Record progress</button>} />
      ) : (
        <div className="fade-in">
          <div className="stats-grid four">
            <StatCard icon={Scale} label="Latest weight" value={`${latest.weight} kg`} tone="green" />
            <StatCard icon={TrendingUp} label="Weight change" value={`${change > 0 ? '+' : ''}${change} kg`} tone="blue" />
            <StatCard icon={Percent} label="Average progress" value={`${average}%`} tone="orange" />
            <StatCard icon={Dumbbell} label="Workouts logged" value={formatNumber(entries.reduce((s, e) => s + e.workoutCompleted, 0))} tone="yellow" />
          </div>

          <div className="grid-equal">
            <ChartCard title="Weight history"><LineChart data={chartData}>{axes(' kg', 62)}<Tooltip formatter={(v) => [`${v} kg`, 'Weight']} /><Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ChartCard>
            <ChartCard title="Workout completion history"><BarChart data={chartData}>{axes('')}<Tooltip formatter={(v) => [v, 'Workouts completed']} /><Bar dataKey="workoutCompleted" fill="#3b82f6" radius={[8, 8, 0, 0]} /></BarChart></ChartCard>
            <ChartCard title="Calories"><AreaChart data={chartData}>{axes(' kcal', 70)}<Tooltip formatter={(v) => [`${v} kcal`, 'Calories']} /><Area type="monotone" dataKey="calories" stroke="#f97316" fill="#fed7aa" strokeWidth={2} /></AreaChart></ChartCard>
            <ChartCard title="Progress percentage"><LineChart data={chartData}>{axes('%')}<Tooltip formatter={(v) => [`${v}%`, 'Progress']} /><Line type="monotone" dataKey="progressPercentage" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ChartCard>
          </div>

          <div className="card-title"><h3><Flame size={18} /> History</h3></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Weight</th><th>Workouts</th><th>Calories</th><th>Progress</th><th /></tr></thead>
              <tbody>
                {[...entries].reverse().map((e) => (
                  <tr key={e._id}>
                    <td>{formatDate(e.date)}</td><td><strong>{e.weight}</strong> kg</td><td>{e.workoutCompleted}</td><td>{formatNumber(e.calories)} kcal</td>
                    <td style={{ minWidth: 150 }}><ProgressBar value={e.progressPercentage} /></td>
                    <td><div className="row-actions">
                      <button className="icon-btn" onClick={() => setEditing(e)} aria-label="Edit entry"><Pencil size={16} /></button>
                      <button className="icon-btn danger" onClick={() => setDeleting(e)} aria-label="Delete entry"><Trash2 size={16} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <ProgressForm entry={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {deleting && <ConfirmDialog title="Delete this entry?" message={`The entry from ${formatDate(deleting.date)} will be permanently removed.`} busy={deleteBusy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </>
  );
}
