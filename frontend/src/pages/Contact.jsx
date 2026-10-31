import { useState } from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Send, CheckCircle2 } from 'lucide-react';
import { Field } from '../components/FormField';
import { Spinner } from '../components/Feedback';
import useForm from '../hooks/useForm';
import { validateContact } from '../utils/validators';
import { contactService, getErrorMessage } from '../services/apiServices';
import { useToast } from '../context/ToastContext';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  const toast = useToast();
  const { values, errors, setErrors, handleChange, reset } = useForm(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSending(true); setServerError(''); setSent(false);
    try {
      const response = await contactService.send(values);
      toast.success(response.message);
      setSent(true);
      reset(EMPTY);
    } catch (error) {
      setServerError(getErrorMessage(error, 'Failed to send your message'));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container"><h1>Contact Us</h1><p>Questions or feedback? Send us a message and we will reply as soon as we can.</p></div>
      </section>
      <section className="section">
        <div className="container contact-layout">
          <div className="card">
            <h3>Get in touch</h3>
            <p className="text-muted">These are placeholder details for the project demo.</p>
            <div className="contact-info">
              <div className="contact-row"><div className="icon-tile"><Phone size={22} /></div><div><strong>Phone</strong><span>+92 300 0000000</span></div></div>
              <div className="contact-row"><div className="icon-tile blue"><Mail size={22} /></div><div><strong>Email</strong><span>support@fitcloud.example</span></div></div>
              <div className="contact-row"><div className="icon-tile orange"><MapPin size={22} /></div><div><strong>Location</strong><span>123 Fitness Avenue, Your City, Pakistan</span></div></div>
            </div>
            <h4 style={{ marginTop: '1.6rem' }}>Follow us</h4>
            <div className="socials" style={{ color: 'var(--text)' }}>
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <span key={i} style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}><Icon size={18} /></span>
              ))}
            </div>
          </div>

          <form className="card" onSubmit={handleSubmit} noValidate>
            <h3>Send us a message</h3>
            {sent && <div className="alert alert-success" role="status"><CheckCircle2 size={18} /> Thank you! Your message has been sent.</div>}
            {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
            <div className="form-grid">
              <Field label="Name" required error={errors.name}><input className={`input ${errors.name ? 'has-error' : ''}`} name="name" value={values.name} onChange={handleChange} /></Field>
              <Field label="Email" required error={errors.email}><input className={`input ${errors.email ? 'has-error' : ''}`} type="email" name="email" value={values.email} onChange={handleChange} /></Field>
              <Field label="Phone" error={errors.phone}><input className={`input ${errors.phone ? 'has-error' : ''}`} name="phone" value={values.phone} onChange={handleChange} placeholder="Optional" /></Field>
              <Field label="Subject" required error={errors.subject}><input className={`input ${errors.subject ? 'has-error' : ''}`} name="subject" value={values.subject} onChange={handleChange} /></Field>
              <Field label="Message" required error={errors.message} className="full"><textarea className={`textarea ${errors.message ? 'has-error' : ''}`} name="message" rows={5} value={values.message} onChange={handleChange} /></Field>
            </div>
            <button className="btn btn-primary" disabled={sending}>{sending ? <Spinner small /> : <Send size={17} />} Send message</button>
          </form>
        </div>
      </section>
    </>
  );
}
