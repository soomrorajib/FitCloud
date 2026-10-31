import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'How does FitCloud work?', a: 'FitCloud is a web app. The React frontend in your browser talks to a Node.js REST API. The API stores your data in MongoDB Atlas (a cloud database) and your profile picture in AWS S3. You register once, log in, and manage everything from the dashboard.' },
  { q: 'How do I create workout plans?', a: 'Open Workout Plans from the sidebar and click Add Workout. Enter the plan name, type, duration, goal, date and status, then save. You can edit a plan, change its status or progress, search by name, and filter by type or status.' },
  { q: 'How does diet tracking work?', a: 'Open Diet Plans and add each meal with its type (breakfast, lunch, dinner or snack), calories and date. FitCloud adds the calories up and shows the total and the amount for each meal type. You can filter by meal type or by date.' },
  { q: 'How is progress calculated?', a: 'FitCloud does not guess your progress. For workout plans, you set the progress percentage yourself (reaching 100% marks the plan Completed). In the Progress page you record weight, workouts completed, calories and a progress percentage, and the dashboard shows your latest values, the average progress and your weight change.' },
  { q: 'How is my data secured?', a: 'Passwords are hashed with bcrypt and never stored as plain text. You sign in with a JWT token, and every API request is checked so you can only read or change your own records. The API also uses input validation, rate limiting and secure HTTP headers. Use HTTPS when you deploy it.' },
  { q: 'How do I update my profile?', a: 'Go to Profile from the sidebar. You can change your name, email, fitness level and profile picture. Pictures must be JPG, PNG or WEBP and up to 2 MB, and are uploaded to AWS S3.' },
  { q: 'How are reports generated?', a: 'Open Reports and choose workouts, diet, exercises, progress or everything, then pick CSV or Excel. The server collects only your data and builds the file inside a Node.js worker thread, so other requests are not slowed down. The file downloads to your device.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <>
      <section className="page-hero">
        <div className="container"><h1>Frequently Asked Questions</h1><p>Quick answers about how FitCloud works.</p></div>
      </section>
      <section className="section">
        <div className="container">
          <div className="accordion">
            {faqs.map((item, index) => {
              const open = openIndex === index;
              return (
                <div key={item.q} className={`acc-item ${open ? 'open' : ''}`}>
                  <button className="acc-btn" onClick={() => setOpenIndex(open ? -1 : index)} aria-expanded={open}>
                    {item.q} <ChevronDown size={20} />
                  </button>
                  <div className="acc-body"><div><p>{item.a}</p></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
