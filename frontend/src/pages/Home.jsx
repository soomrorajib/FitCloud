import { Link } from 'react-router-dom';
import {
  Dumbbell, HeartPulse, Salad, Flower2, Scale, BedDouble, LineChart, Apple, Clock, Smartphone,
  ShieldCheck, LifeBuoy, ArrowRight, CheckCircle2, Star, Cloud,
} from 'lucide-react';

const categories = [
  { icon: Dumbbell, title: 'Strength Training', text: 'Build lean muscle with structured lifting plans.', cls: 'cat-1' },
  { icon: HeartPulse, title: 'Cardio Training', text: 'Boost stamina and heart health with running, cycling and more.', cls: 'cat-2' },
  { icon: Salad, title: 'Nutrition Planning', text: 'Log meals and keep daily calories on target.', cls: 'cat-3' },
  { icon: Flower2, title: 'Yoga & Flexibility', text: 'Improve mobility, balance and calm.', cls: 'cat-4' },
  { icon: Scale, title: 'Weight Management', text: 'Track your weight and see the trend over time.', cls: 'cat-5' },
  { icon: BedDouble, title: 'Recovery & Rest', text: 'Plan lighter days so your body can rebuild.', cls: 'cat-6' },
];

const features = [
  { icon: LineChart, title: 'Progress Tracking', text: 'Record weight, workouts and calories, then watch clear charts of your journey.', tone: '' },
  { icon: Apple, title: 'Smart Nutrition', text: 'Log every meal and see calories split by breakfast, lunch, dinner and snacks.', tone: 'orange' },
  { icon: Clock, title: 'Time Management', text: 'Schedule workouts by date and see today\u2019s plan the moment you log in.', tone: 'blue' },
  { icon: Smartphone, title: 'Easy Access', text: 'Responsive design that works on your phone, tablet and laptop.', tone: 'yellow' },
  { icon: ShieldCheck, title: 'Secure Data', text: 'Hashed passwords, token-based login and private per-user data.', tone: 'red' },
  { icon: LifeBuoy, title: 'Support', text: 'Questions? Use the contact form and our team will get back to you.', tone: '' },
];

const testimonials = [
  { name: 'Ayesha K.', role: 'Beginner, 3 months', text: 'The dashboard shows exactly what I planned for today. Staying consistent finally feels simple.' },
  { name: 'Hamza R.', role: 'Strength trainer', text: 'Logging workouts and watching the weight chart move keeps me motivated every single week.' },
  { name: 'Sana M.', role: 'Yoga enthusiast', text: 'I love exporting my progress to a spreadsheet. Clean, fast and easy to use on my phone.' },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow"><Cloud size={16} /> Cloud-based fitness management</span>
            <h1>Train smarter. Eat better. <span>Track everything in the cloud.</span></h1>
            <p className="lead">FitCloud brings your workouts, meals, exercises and body progress into one secure place, available on any device, anytime.</p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started <ArrowRight size={18} /></Link>
              <Link to="/login" className="btn btn-ghost-light btn-lg">Login</Link>
            </div>
            <div className="hero-badges">
              <span><CheckCircle2 size={16} /> Free to start</span>
              <span><CheckCircle2 size={16} /> Secure login</span>
              <span><CheckCircle2 size={16} /> Export your data</span>
            </div>
          </div>

          <div className="preview" aria-hidden="true">
            <div className="preview-head"><span>Your week at a glance</span><small>Illustration</small></div>
            <div className="preview-grid">
              <div className="preview-tile"><small>Weekly goal</small><div className="ring"><span>72%</span></div></div>
              <div className="preview-tile"><small>Workouts</small><strong>5 / 7</strong><div className="bars">{[40, 65, 50, 85, 60, 95, 70].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div></div>
              <div className="preview-tile"><small>Calories today</small><strong>1,840</strong></div>
              <div className="preview-tile"><small>Weight trend</small><strong>-1.2 kg</strong></div>
            </div>
            <p className="preview-note">Sample preview. Your dashboard shows your real data.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="tag">Welcome to FitCloud</span>
            <h2>Everything you need for a healthier lifestyle</h2>
            <p>Fitness works when it is planned, measured and repeated. FitCloud keeps your plan and your results in one cloud-hosted app so you can focus on training, not on spreadsheets.</p>
          </div>
          <div className="grid-3">
            {categories.map(({ icon: Icon, title, text, cls }) => (
              <article key={title} className={`category-card ${cls}`}>
                <Icon className="bg-icon" strokeWidth={1.4} />
                <h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-head">
            <span className="tag">Features</span>
            <h2>Built to keep you consistent</h2>
            <p>Simple tools that work together, from the first workout to long-term progress.</p>
          </div>
          <div className="grid-3">
            {features.map(({ icon: Icon, title, text, tone }) => (
              <div key={title} className="info-card">
                <div className={`icon-tile ${tone}`}><Icon size={26} /></div>
                <h3>{title}</h3><p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><span className="tag">How it works</span><h2>Start in three steps</h2></div>
          <div className="grid-3 steps">
            <div className="step"><h3>Create your account</h3><p className="text-muted">Register in under a minute and pick your fitness level.</p></div>
            <div className="step"><h3>Plan and log</h3><p className="text-muted">Add workouts, meals and exercises, and record your progress.</p></div>
            <div className="step"><h3>See your results</h3><p className="text-muted">Use the dashboard and charts, or export reports to CSV and Excel.</p></div>
          </div>
        </div>
      </section>

      <section className="section dark">
        <div className="container">
          <div className="section-head">
            <span className="tag" style={{ color: '#6ee7b7' }}>Testimonials</span>
            <h2>Loved by people who train</h2>
            <p>Sample testimonials shown for demonstration purposes.</p>
          </div>
          <div className="grid-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="testimonial" style={{ margin: 0 }}>
                <div className="stars">{[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}</div>
                <p>“{t.text}”</p>
                <div className="person">
                  <div className="avatar-initial">{t.name[0]}</div>
                  <div><strong>{t.name}</strong><small>{t.role}</small></div>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta">
            <h2>Ready to start your fitness journey?</h2>
            <p>Create your free FitCloud account and plan your first workout today.</p>
            <Link to="/register" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary-700)' }}>Create free account <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
