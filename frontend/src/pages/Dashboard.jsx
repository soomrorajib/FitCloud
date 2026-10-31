import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Dumbbell, Target, CheckCircle2, Utensils, Activity, Flame, Plus, TrendingUp, TrendingDown, CalendarCheck } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { dashboardService } from '../services/apiServices';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState, EmptyState } from '../components/Feedback';
import { Badge, ProgressBar, StatCard } from '../components/Widgets';
import { formatDate, formatNumber, formatShortDate, todayInput } from '../utils/format';

const STATUS_COLORS = { 'Not Started': '#94a3b8', 'In Progress': '#3b82f6', Completed: '#10b981' };
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const ChartEmpty = ({ text, to, label }) => (
  <EmptyState title="No data yet" text={text} action={<Link to={to} className="btn btn-primary btn-sm">{label}</Link>} />
);

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(
    async () => (await dashboardService.get({ date: todayInput() })).data, [], 'Failed to load dashboard'
  );

  if (loading && !data) return <LoadingState text="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { stats, todaysWorkouts, todaysDiet, progressSummary: ps, charts, recent } = data;
  const statusData = Object.entries(charts.statusBreakdown).map(([name, value]) => ({ name, value })).filter((item) => item.value > 0);
  const weightData = charts.weightTrend.map((point) => ({ ...point, label: formatShortDate(point.date) }));
  const maxCalories = Math.max(1, ...MEAL_TYPES.map((type) => todaysDiet.summary[type]));
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <div className="welcome">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]}!</h1>
          <p>{today}. Here is your fitness overview.</p>
        </div>
        <Link to="/workouts" className="btn btn-primary"><Plus size={18} /> Add workout</Link>
      </div>

      <div className="stats-grid five">
        <StatCard icon={Dumbbell} label="Total workout plans" value={formatNumber(stats.totalWorkouts)} tone="green" />
        <StatCard icon={Target} label="Active goals" value={formatNumber(stats.activeGoals)} tone="blue" />
        <StatCard icon={CheckCircle2} label="Completed goals" value={formatNumber(stats.completedGoals)} tone="orange" />
        <StatCard icon={Utensils} label="Total meals" value={formatNumber(stats.totalMeals)} tone="yellow" />
        <StatCard icon={Activity} label="Total exercises" value={formatNumber(stats.totalExercises)} tone="red" />
      </div>

      <div className="grid-main">
        <div className="card">
          <div className="card-title"><h3><TrendingUp size={18} /> Weight progress</h3><Link to="/progress" className="btn btn-outline btn-sm">Details</Link></div>
          {weightData.length === 0 ? <ChartEmpty text="Record your weight on the Progress page to see your trend." to="/progress" label="Record progress" /> : (
            <div className="chart-box">
              <ResponsiveContainer>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12 }} unit=" kg" width={62} />
                  <Tooltip formatter={(value) => [`${value} kg`, 'Weight']} />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title"><h3><Target size={18} /> Workout status</h3></div>
          {statusData.length === 0 ? <ChartEmpty text="Create a workout plan to see its status here." to="/workouts" label="Add workout" /> : (
            <div className="chart-box">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {statusData.map((item) => <Cell key={item.name} fill={STATUS_COLORS[item.name]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid-equal">
        <div className="card">
          <div className="card-title"><h3><Dumbbell size={18} /> Workout progress</h3></div>
          {charts.workoutProgress.length === 0 ? <ChartEmpty text="Your latest plans and their progress will appear here." to="/workouts" label="Add workout" /> : (
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={charts.workoutProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={(v) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} width={46} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                  <Bar dataKey="progress" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title"><h3><TrendingUp size={18} /> Progress summary</h3></div>
          {ps.entries === 0 ? <ChartEmpty text="No progress entries yet." to="/progress" label="Record progress" /> : (
            <div className="nutri-row">
              <ul className="mini-list">
                <li><span>Latest weight</span><strong>{ps.latestWeight} kg</strong></li>
                <li><span>Weight change</span>
                  <strong style={{ color: ps.weightChange <= 0 ? 'var(--primary-600)' : 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {ps.weightChange <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />} {ps.weightChange > 0 ? '+' : ''}{ps.weightChange} kg
                  </strong></li>
                <li><span>Workouts logged</span><strong>{formatNumber(ps.totalWorkoutsLogged)}</strong></li>
                <li><span>Entries recorded</span><strong>{ps.entries}</strong></li>
              </ul>
              <div className="nutri-item"><div className="head"><span>Latest progress</span></div><ProgressBar value={ps.latestProgress} /></div>
              <div className="nutri-item"><div className="head"><span>Average progress</span></div><ProgressBar value={ps.averageProgress} tone="orange" /></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid-equal">
        <div className="card">
          <div className="card-title"><h3><CalendarCheck size={18} /> Today’s workout</h3><Link to="/workouts" className="btn btn-outline btn-sm">Manage</Link></div>
          {todaysWorkouts.length === 0 ? <EmptyState title="Nothing planned today" text="Add a workout dated today and it will show up here." action={<Link to="/workouts" className="btn btn-primary btn-sm">Plan a workout</Link>} /> : (
            <ul className="mini-list">
              {todaysWorkouts.map((w) => (
                <li key={w._id}>
                  <div><strong>{w.planName}</strong><small>{w.duration} min · {w.goal || 'No goal set'}</small></div>
                  <div style={{ textAlign: 'right' }}><Badge value={w.status} /><div style={{ marginTop: 6, minWidth: 130 }}><ProgressBar value={w.progress} /></div></div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-title"><h3><Flame size={18} /> Today’s diet</h3><strong>{formatNumber(todaysDiet.summary.totalCalories)} kcal</strong></div>
          {todaysDiet.meals.length === 0 ? <EmptyState title="No meals logged today" text="Log your meals to see today’s nutrition summary." action={<Link to="/diet" className="btn btn-primary btn-sm">Add meal</Link>} /> : (
            <>
              <div className="nutri-row" style={{ marginBottom: '1rem' }}>
                {MEAL_TYPES.map((type) => (
                  <div className="nutri-item" key={type}>
                    <div className="head"><span>{type}</span><span>{formatNumber(todaysDiet.summary[type])} kcal</span></div>
                    <div className="progress bar-orange"><i style={{ width: `${(todaysDiet.summary[type] / maxCalories) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
              <ul className="mini-list">
                {todaysDiet.meals.map((m) => <li key={m._id}><div><strong>{m.mealName}</strong><small><Badge value={m.mealType} /></small></div><strong>{formatNumber(m.calories)} kcal</strong></li>)}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="grid-thirds">
        <div className="card">
          <div className="card-title"><h3>Recent workouts</h3><Link to="/workouts" className="text-muted">View all</Link></div>
          {recent.workouts.length === 0 ? <p className="text-muted">No workouts yet.</p> : (
            <ul className="mini-list">{recent.workouts.map((w) => <li key={w._id}><div><strong>{w.planName}</strong><small>{formatDate(w.date)}</small></div><Badge value={w.status} /></li>)}</ul>
          )}
        </div>
        <div className="card">
          <div className="card-title"><h3>Recent meals</h3><Link to="/diet" className="text-muted">View all</Link></div>
          {recent.meals.length === 0 ? <p className="text-muted">No meals yet.</p> : (
            <ul className="mini-list">{recent.meals.map((m) => <li key={m._id}><div><strong>{m.mealName}</strong><small>{formatDate(m.date)} · {m.mealType}</small></div><strong>{formatNumber(m.calories)}</strong></li>)}</ul>
          )}
        </div>
        <div className="card">
          <div className="card-title"><h3>Recent exercises</h3><Link to="/exercises" className="text-muted">View all</Link></div>
          {recent.exercises.length === 0 ? <p className="text-muted">No exercises yet.</p> : (
            <ul className="mini-list">{recent.exercises.map((e) => <li key={e._id}><div><strong>{e.name}</strong><small>{e.duration} min</small></div><Badge value={e.type} /></li>)}</ul>
          )}
        </div>
      </div>
    </>
  );
}
