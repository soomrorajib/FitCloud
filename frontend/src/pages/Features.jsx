import {
  LayoutDashboard, Dumbbell, Utensils, Activity, TrendingUp, FileDown, UserRound, ShieldCheck, Cpu, Search, Smartphone, Cloud,
} from 'lucide-react';

const features = [
  { icon: LayoutDashboard, title: 'Smart dashboard', text: 'Today\u2019s workout, today\u2019s meals, key stats and charts, all from live data.' },
  { icon: Dumbbell, title: 'Workout plans', text: 'Create plans with type, duration, goal, date and status. Track progress from 0 to 100%.', tone: 'orange' },
  { icon: Utensils, title: 'Diet tracking', text: 'Log breakfast, lunch, dinner and snacks with calories and see daily totals.', tone: 'yellow' },
  { icon: Activity, title: 'Exercise library', text: 'Keep your own list of exercises with type, duration and notes.', tone: 'blue' },
  { icon: TrendingUp, title: 'Progress charts', text: 'Weight, workouts, calories and progress percentage over time.' },
  { icon: Search, title: 'Search and filters', text: 'Find plans by name, filter by type or status, and filter meals by type or date.', tone: 'blue' },
  { icon: FileDown, title: 'Reports export', text: 'Download workouts, diet, exercises and progress as CSV or Excel (XLSX).', tone: 'orange' },
  { icon: Cpu, title: 'Worker-thread reports', text: 'Reports are generated in a Node.js worker thread so the API stays responsive.', tone: 'red' },
  { icon: UserRound, title: 'Profile and photo', text: 'Update your details and upload a profile picture stored on AWS S3.' },
  { icon: ShieldCheck, title: 'Secure by design', text: 'bcrypt passwords, JWT login, rate limiting, input validation and private user data.', tone: 'red' },
  { icon: Smartphone, title: 'Responsive layout', text: 'Sidebar dashboard on desktop and a collapsible menu on mobile.', tone: 'yellow' },
  { icon: Cloud, title: 'Cloud-ready', text: 'Frontend and backend deploy separately: API on AWS EC2, data on MongoDB Atlas.', tone: 'blue' },
];

export default function Features() {
  return (
    <>
      <section className="page-hero">
        <div className="container"><h1>Features</h1><p>Everything FitCloud offers to help you plan, track and improve.</p></div>
      </section>
      <section className="section">
        <div className="container grid-3">
          {features.map(({ icon: Icon, title, text, tone }) => (
            <div key={title} className="info-card"><div className={`icon-tile ${tone || ''}`}><Icon size={26} /></div><h3>{title}</h3><p>{text}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}
