import { useState } from 'react';
import { Utensils, Plus, Pencil, Trash2, Save, X, Flame, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import useForm from '../hooks/useForm';
import { dietService } from '../services/apiServices';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingState, ErrorState, EmptyState, Spinner } from '../components/Feedback';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Field } from '../components/FormField';
import { Badge, PageHeader, StatCard } from '../components/Widgets';
import { MEAL_TYPES, validateMeal } from '../utils/validators';
import { formatDate, formatNumber, toInputDate, todayInput } from '../utils/format';

const emptyMeal = () => ({ mealName: '', mealType: 'Breakfast', calories: '', description: '', date: todayInput() });

function MealForm({ meal, onClose, onSaved }) {
  const toast = useToast();
  const { values, errors, setErrors, handleChange } = useForm(
    meal ? { ...meal, date: toInputDate(meal.date), description: meal.description || '' } : emptyMeal()
  );
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateMeal(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = { mealName: values.mealName.trim(), mealType: values.mealType, calories: Number(values.calories), description: values.description.trim(), date: values.date };
    setSaving(true); setServerError('');
    try {
      const response = meal ? await dietService.update(meal._id, payload) : await dietService.create(payload);
      toast.success(response.message);
      onSaved();
    } catch (error) {
      setServerError(getErrorMessage(error, 'Failed to save meal'));
    } finally { setSaving(false); }
  };

  return (
    <Modal title={meal ? 'Edit meal' : 'Add meal'} onClose={onClose}
      footer={<>
        <button className="btn btn-outline" type="button" onClick={onClose}><X size={16} /> Cancel</button>
        <button className="btn btn-primary" form="meal-form" disabled={saving}>{saving ? <Spinner small /> : <Save size={16} />} {meal ? 'Save changes' : 'Add meal'}</button>
      </>}>
      <form id="meal-form" onSubmit={handleSubmit} noValidate>
        {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
        <div className="form-grid">
          <Field label="Meal name" required error={errors.mealName} className="full"><input className={`input ${errors.mealName ? 'has-error' : ''}`} name="mealName" value={values.mealName} onChange={handleChange} placeholder="e.g. Oats with banana" /></Field>
          <Field label="Meal type" required error={errors.mealType}><select className="select" name="mealType" value={values.mealType} onChange={handleChange}>{MEAL_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Calories (kcal)" required error={errors.calories}><input className={`input ${errors.calories ? 'has-error' : ''}`} type="number" min="1" name="calories" value={values.calories} onChange={handleChange} /></Field>
          <Field label="Date" required error={errors.date}><input className={`input ${errors.date ? 'has-error' : ''}`} type="date" name="date" value={values.date} onChange={handleChange} /></Field>
          <Field label="Description" className="full"><textarea className="textarea" name="description" rows={3} value={values.description} onChange={handleChange} /></Field>
        </div>
      </form>
    </Modal>
  );
}

export default function Diet() {
  const toast = useToast();
  const [mealType, setMealType] = useState('');
  const [date, setDate] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const list = useFetch(() => dietService.list({ mealType: mealType || undefined, date: date || undefined }), [mealType, date], 'Failed to load meals');
  // Summary sirf date filter follow karti hai (meal type filter se alag), taake sab types ka total dikhe
  const summary = useFetch(() => dietService.summary({ date: date || undefined }), [date], 'Failed to load nutrition summary');
  const meals = list.data?.data || [];
  const totals = summary.data?.data;
  const hasFilters = Boolean(mealType || date);
  const reloadAll = () => { list.reload(); summary.reload(); };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      const response = await dietService.remove(deleting._id);
      toast.success(response.message);
      setDeleting(null); reloadAll();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to delete meal')); }
    finally { setDeleteBusy(false); }
  };

  return (
    <>
      <PageHeader title="Diet Plans" subtitle="Log meals and keep an eye on your calories."
        action={<button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Add meal</button>} />

      <p className="text-muted" style={{ marginBottom: '.6rem' }}>Nutrition summary: <strong>{date ? formatDate(date) : 'All time'}</strong></p>
      <div className="stats-grid five">
        <StatCard icon={Flame} label="Total calories" value={totals ? formatNumber(totals.totalCalories) : '...'} tone="red" />
        <StatCard icon={Coffee} label="Breakfast" value={totals ? formatNumber(totals.Breakfast) : '...'} tone="yellow" />
        <StatCard icon={Sun} label="Lunch" value={totals ? formatNumber(totals.Lunch) : '...'} tone="green" />
        <StatCard icon={Moon} label="Dinner" value={totals ? formatNumber(totals.Dinner) : '...'} tone="blue" />
        <StatCard icon={Cookie} label="Snack" value={totals ? formatNumber(totals.Snack) : '...'} tone="orange" />
      </div>
      {summary.error && <div className="alert alert-error">{summary.error}</div>}

      <div className="toolbar">
        <select className="select" value={mealType} onChange={(e) => setMealType(e.target.value)} aria-label="Filter by meal type"><option value="">All meal types</option>{MEAL_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <input className="input date" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
        <button className="btn btn-outline btn-sm" onClick={() => setDate(todayInput())}>Today</button>
        {hasFilters && <button className="btn btn-outline btn-sm" onClick={() => { setMealType(''); setDate(''); }}>Clear filters</button>}
      </div>

      {list.loading && !list.data ? <LoadingState text="Loading meals..." /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : meals.length === 0 ? (
        <EmptyState icon={Utensils} title={hasFilters ? 'No meals match your filters' : 'No meals logged yet'}
          text={hasFilters ? 'Try another date or clear the filters.' : 'Add your first meal to start tracking calories.'}
          action={!hasFilters && <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Add meal</button>} />
      ) : (
        <div className="table-wrap fade-in">
          <table className="table">
            <thead><tr><th>Meal</th><th>Type</th><th>Calories</th><th>Date</th><th /></tr></thead>
            <tbody>
              {meals.map((m) => (
                <tr key={m._id}>
                  <td><div className="name">{m.mealName}</div><div className="desc">{m.description || '-'}</div></td>
                  <td><Badge value={m.mealType} /></td>
                  <td><strong>{formatNumber(m.calories)}</strong> kcal</td>
                  <td>{formatDate(m.date)}</td>
                  <td><div className="row-actions">
                    <button className="icon-btn" onClick={() => setEditing(m)} aria-label={`Edit ${m.mealName}`}><Pencil size={16} /></button>
                    <button className="icon-btn danger" onClick={() => setDeleting(m)} aria-label={`Delete ${m.mealName}`}><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <MealForm meal={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reloadAll(); }} />}
      {deleting && <ConfirmDialog title="Delete this meal?" message={`“${deleting.mealName}” will be permanently removed.`} busy={deleteBusy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </>
  );
}
