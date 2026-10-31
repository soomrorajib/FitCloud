import { useState } from 'react';
import { Dumbbell, Utensils, Activity, TrendingUp, Download, FileSpreadsheet, FileText, Cpu, Database } from 'lucide-react';
import { reportService } from '../services/apiServices';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/Widgets';
import { Spinner } from '../components/Feedback';

const reports = [
  { key: 'workouts', path: '/reports/workouts', icon: Dumbbell, title: 'Workout data', text: 'All your workout plans with type, duration, goal, status and progress.', tone: 'green' },
  { key: 'diet', path: '/reports/diet', icon: Utensils, title: 'Diet data', text: 'Every meal with its type, calories and date.', tone: 'yellow' },
  { key: 'exercises', path: '/reports/exercises', icon: Activity, title: 'Exercise data', text: 'Your exercise library with type, duration and notes.', tone: 'blue' },
  { key: 'progress', path: '/reports/progress', icon: TrendingUp, title: 'Progress data', text: 'Weight, workouts completed, calories and progress percentage by date.', tone: 'orange' },
];

export default function Reports() {
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const [last, setLast] = useState(null);

  const download = async (id, path, params) => {
    setBusy(id);
    try {
      const result = await reportService.download(path, params);
      setLast(result);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to generate the report'));
    } finally { setBusy(''); }
  };

  const Buttons = ({ id, path, extra = {} }) => (
    <div className="report-actions">
      {['csv', 'xlsx'].map((format) => (
        <button key={format} className={`btn btn-sm ${format === 'xlsx' ? 'btn-primary' : 'btn-outline'}`} disabled={Boolean(busy)}
          onClick={() => download(`${id}-${format}`, path, { ...extra, format })}>
          {busy === `${id}-${format}` ? <Spinner small /> : format === 'xlsx' ? <FileSpreadsheet size={15} /> : <FileText size={15} />} {format.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title="Reports" subtitle="Export your data as CSV or Excel (XLSX)." />

      <div className="grid-equal">
        {reports.map(({ key, path, icon: Icon, title, text, tone }) => (
          <div key={key} className="card report-card">
            <div className={`stat-icon tone-${tone}`}><Icon size={22} /></div>
            <h3>{title}</h3><p>{text}</p>
            <Buttons id={key} path={path} />
          </div>
        ))}
      </div>

      <div className="card report-card" style={{ marginBottom: '1.2rem' }}>
        <div className="card-title"><h3><Database size={18} /> Export everything</h3></div>
        <p>One file with workouts, diet, exercises and progress. XLSX puts each in its own sheet; CSV stacks them in sections.</p>
        <Buttons id="all" path="/reports/export" extra={{ type: 'all' }} />
      </div>

      <div className="thread-box">
        <h3><Cpu size={20} /> Generated in a worker thread</h3>
        <p>Your report is not built by the main web server thread. The API collects your data and hands it to a Node.js <code>Worker Thread</code> that creates the file, so other users’ requests stay fast.</p>
        {last ? (
          <p style={{ marginBottom: 0 }}>Last report: <code>{last.fileName}</code> · {last.rows} rows · built by worker thread <code>#{last.threadId}</code> in <code>{last.workerMs} ms</code> (total {last.totalMs} ms)</p>
        ) : <p style={{ marginBottom: 0 }}>Download a report to see which worker thread built it.</p>}
      </div>
    </>
  );
}
