import { Target, Eye, Heart, Cloud, Monitor, Server, Database, HardDrive } from 'lucide-react';

const values = [
  { icon: Target, title: 'Our mission', text: 'Make planning and measuring fitness simple for everyone, with tools that are clear, fast and private.' },
  { icon: Eye, title: 'Our vision', text: 'A healthier community where anyone can build lasting habits using data they own and understand.', tone: 'orange' },
  { icon: Heart, title: 'Our values', text: 'Privacy first, honest numbers, and a clean experience without clutter.', tone: 'red' },
];

const stack = [
  { icon: Monitor, title: 'React frontend', text: 'A responsive single-page app that talks to the API over REST.', tone: 'blue' },
  { icon: Server, title: 'Node.js + Express API', text: 'MVC backend with JWT authentication and worker threads for reports.', tone: '' },
  { icon: Database, title: 'MongoDB Atlas', text: 'Cloud database that stores users, plans, meals and progress.', tone: 'yellow' },
  { icon: HardDrive, title: 'AWS S3', text: 'Profile pictures are stored in an S3 bucket, not in the database.', tone: 'orange' },
];

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container"><h1>About FitCloud</h1><p>A cloud-based fitness and health management system built as a distributed application.</p></div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="tag">Our story</span>
            <h2>Fitness data should not live in scattered notebooks</h2>
            <p>FitCloud started as a Cloud Computing project: take a simple fitness app and rebuild it the way real cloud products are built, with a separate frontend, REST API, cloud database and cloud file storage.</p>
          </div>
          <div className="grid-3">
            {values.map(({ icon: Icon, title, text, tone }) => (
              <div key={title} className="info-card"><div className={`icon-tile ${tone || ''}`}><Icon size={26} /></div><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-head">
            <span className="tag"><Cloud size={14} style={{ verticalAlign: '-2px' }} /> Cloud architecture</span>
            <h2>How FitCloud is built</h2>
            <p>Every part is separate, so each can be deployed and scaled on its own.</p>
          </div>
          <div className="grid-4">
            {stack.map(({ icon: Icon, title, text, tone }) => (
              <div key={title} className="info-card"><div className={`icon-tile ${tone}`}><Icon size={26} /></div><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
          <div className="arch-flow"><span>Browser</span><i>→</i><span>React</span><i>→ REST/JSON →</i><span>Express API</span><i>→</i><span>MongoDB Atlas + AWS S3</span></div>
        </div>
      </section>
    </>
  );
}
