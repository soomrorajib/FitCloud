// Optional UI flow test (jsdom). Backend must be running on VITE_API_URL and CLIENT_URL must be http://localhost:5173.
// WARNING: it creates real users and data, so point the backend at a TEST database, not your main Atlas database.
// Run: npm run test:ui
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../src/App';
import { ToastProvider } from '../src/context/ToastContext';
import { AuthProvider } from '../src/context/AuthContext';

const email = `ui${Date.now()}@test.com`;
const user = userEvent.setup();
const mount = (path = '/') => {
  cleanup();
  window.history.pushState({}, '', path);
  return render(<BrowserRouter><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></BrowserRouter>);
};
const type = async (el, text) => { await user.clear(el); await user.type(el, text); };
const goto = async (name) => { await user.click(within(document.querySelector('.sidebar')).getByText(name)); };

beforeAll(() => {
  window.URL.createObjectURL = () => 'blob:test';
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function () { window.__downloaded = this.download; };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = () => {};
});

describe('FitCloud frontend against real backend', () => {
  it('public pages render', async () => {
    mount('/');
    expect(screen.getByText(/Track everything in the cloud/i)).toBeTruthy();
    for (const t of ['Strength Training', 'Cardio Training', 'Nutrition Planning', 'Yoga & Flexibility', 'Weight Management', 'Recovery & Rest', 'Smart Nutrition', 'Secure Data']) {
      expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    }
    for (const [path, text] of [['/about', /How FitCloud is built/], ['/features', /Smart dashboard/], ['/faq', /How is progress calculated/], ['/contact', /Get in touch/], ['/nope', /Page not found/]]) {
      mount(path); expect(await screen.findByText(text)).toBeTruthy();
    }
  });

  it('FAQ accordion toggles', async () => {
    mount('/faq');
    const btn = screen.getByRole('button', { name: /How are reports generated/ });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    await user.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('contact form validates and stores message', async () => {
    mount('/contact');
    await user.click(screen.getByRole('button', { name: /Send message/ }));
    expect(await screen.findByText('Name is required')).toBeTruthy();
    const form = document.querySelector('form');
    await type(form.querySelector('[name=name]'), 'Visitor');
    await type(form.querySelector('[name=email]'), 'visitor@test.com');
    await type(form.querySelector('[name=subject]'), 'Hello');
    await type(form.querySelector('[name=message]'), 'Testing the contact form');
    await user.click(screen.getByRole('button', { name: /Send message/ }));
    expect((await screen.findAllByText(/Your message has been sent/)).length).toBeGreaterThan(0);
  });

  it('protected route redirects to login', async () => {
    localStorage.clear();
    mount('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeTruthy();
    expect(window.location.pathname).toBe('/login');
  });

  it('login shows friendly error for wrong credentials', async () => {
    mount('/login');
    await type(document.querySelector('[name=email]'), 'nobody@test.com');
    await type(document.querySelector('[name=password]'), 'Wrong@1234');
    await user.click(screen.getByRole('button', { name: /^Login$/ }));
    expect(await screen.findByText('Invalid email or password')).toBeTruthy();
  });

  it('register validates, then creates account and opens dashboard', async () => {
    mount('/register');
    await user.click(screen.getByRole('button', { name: /Create account/ }));
    expect(await screen.findByText('Name must be 2 to 50 characters')).toBeTruthy();
    await type(document.querySelector('[name=name]'), 'Ui Tester');
    await type(document.querySelector('[name=email]'), email);
    await type(document.querySelector('[name=password]'), 'weak');
    await type(document.querySelector('[name=confirmPassword]'), 'weak');
    await user.click(screen.getByRole('button', { name: /Create account/ }));
    expect((await screen.findAllByText(/Use at least 8 characters/)).length).toBeGreaterThan(0);
    await type(document.querySelector('[name=password]'), 'Strong@123');
    await type(document.querySelector('[name=confirmPassword]'), 'Strong@123');
    await user.click(screen.getByRole('button', { name: /Create account/ }));
    expect(await screen.findByText(/Welcome back, Ui!/)).toBeTruthy();
    expect(window.location.pathname).toBe('/dashboard');
    expect(localStorage.getItem('fitcloud_token')).toBeTruthy();
  });

  it('dashboard shows real zero stats + empty states for a new user', async () => {
    mount('/dashboard');
    expect(await screen.findByText(/Welcome back, Ui!/)).toBeTruthy();
    expect(screen.getByText('Total workout plans')).toBeTruthy();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText('Nothing planned today')).toBeTruthy();
  });

  it('workout CRUD + search + filter + status change', async () => {
    mount('/dashboard');
    await screen.findByText(/Welcome back/);
    await goto('Workout Plans');
    expect(await screen.findByText('No workouts yet')).toBeTruthy();
    for (const [name, typ, dur] of [['Morning Run', 'Cardio', '30'], ['Heavy Lifting', 'Strength', '60']]) {
      await user.click(screen.getAllByRole('button', { name: /Add workout/ })[0]);
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /Add workout/ }));
      expect(await within(dialog).findByText('Plan name is required')).toBeTruthy();
      await type(dialog.querySelector('[name=planName]'), name);
      await user.selectOptions(dialog.querySelector('[name=type]'), typ);
      await type(dialog.querySelector('[name=duration]'), dur);
      await user.click(within(dialog).getByRole('button', { name: /Add workout/ }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(await screen.findByText(name)).toBeTruthy();
    }
    await user.type(screen.getByLabelText('Search workouts'), 'morning');
    await waitFor(() => expect(screen.queryByText('Heavy Lifting')).toBeNull());
    expect(screen.getByText('Morning Run')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('Heavy Lifting')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Filter by type'), 'Strength');
    await waitFor(() => expect(screen.queryByText('Morning Run')).toBeNull());
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await screen.findByText('Morning Run');
    await user.selectOptions(screen.getByLabelText('Status of Morning Run'), 'Completed');
    await waitFor(() => expect(within(screen.getByText('Morning Run').closest('tr')).getByText('100%')).toBeTruthy());
    await user.click(screen.getByLabelText('Edit Heavy Lifting'));
    const dialog = await screen.findByRole('dialog');
    await type(dialog.querySelector('[name=planName]'), 'Heavy Lifting v2');
    await user.click(within(dialog).getByRole('button', { name: /Save changes/ }));
    expect(await screen.findByText('Heavy Lifting v2')).toBeTruthy();
    await user.click(screen.getByLabelText('Delete Heavy Lifting v2'));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByText('Heavy Lifting v2')).toBeNull());
  });

  it('diet: add meal and nutrition summary', async () => {
    mount('/diet');
    expect(await screen.findByText('No meals logged yet')).toBeTruthy();
    await user.click(screen.getAllByRole('button', { name: /Add meal/ })[0]);
    const dialog = await screen.findByRole('dialog');
    await type(dialog.querySelector('[name=mealName]'), 'Oats with banana');
    await type(dialog.querySelector('[name=calories]'), '350');
    await user.click(within(dialog).getByRole('button', { name: /Add meal/ }));
    expect(await screen.findByText('Oats with banana')).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText('350').length).toBeGreaterThanOrEqual(2));
  });

  it('exercise: add, search', async () => {
    mount('/exercises');
    expect(await screen.findByText('No exercises yet')).toBeTruthy();
    await user.click(screen.getAllByRole('button', { name: /Add exercise/ })[0]);
    const dialog = await screen.findByRole('dialog');
    await type(dialog.querySelector('[name=name]'), 'Plank');
    await type(dialog.querySelector('[name=duration]'), '5');
    await user.click(within(dialog).getByRole('button', { name: /Add exercise/ }));
    expect(await screen.findByText('Plank')).toBeTruthy();
    await user.type(screen.getByLabelText('Search exercises'), 'zzz');
    expect(await screen.findByText('No exercises match your filters')).toBeTruthy();
  });

  it('progress: add entry shows stats and history', async () => {
    mount('/progress');
    expect(await screen.findByText('No progress recorded yet')).toBeTruthy();
    await user.click(screen.getAllByRole('button', { name: /Record progress/ })[0]);
    const dialog = await screen.findByRole('dialog');
    await type(dialog.querySelector('[name=weight]'), '80.5');
    await user.click(within(dialog).getByRole('button', { name: /Save entry/ }));
    expect(await screen.findByText('Latest weight')).toBeTruthy();
    expect(screen.getAllByText('80.5').length).toBeGreaterThan(0);
  });

  it('dashboard now shows real data', async () => {
    mount('/dashboard');
    expect(await screen.findByText(/Welcome back/)).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText('Oats with banana').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Morning Run').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Latest weight').length).toBeGreaterThan(0);
  });

  it('reports download through worker thread', async () => {
    mount('/reports');
    await screen.findByText('Workout data');
    await user.click(screen.getAllByRole('button', { name: 'CSV' })[0]);
    await waitFor(() => expect(window.__downloaded).toMatch(/fitcloud-workouts-.*\.csv/));
    expect(await screen.findByText(/built by worker thread/)).toBeTruthy();
  });

  it('profile update', async () => {
    mount('/profile');
    const input = await screen.findByDisplayValue('Ui Tester');
    await type(input, 'Ui Renamed');
    await user.click(screen.getByRole('button', { name: /Save changes/ }));
    expect((await screen.findAllByText('Ui Renamed')).length).toBeGreaterThan(0);
  });

  it('invalid token redirects to login with friendly message', async () => {
    localStorage.setItem('fitcloud_token', 'bad.token.here');
    mount('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeTruthy();
    expect((await screen.findAllByText('Session expired. Please login again.')).length).toBeGreaterThan(0);
  });

  it('logout returns to login', async () => {
    localStorage.clear();
    mount('/login');
    await type(document.querySelector('[name=email]'), email);
    await type(document.querySelector('[name=password]'), 'Strong@123');
    await user.click(screen.getByRole('button', { name: /^Login$/ }));
    await screen.findByText(/Welcome back, Ui/);
    await user.click(within(document.querySelector('.sidebar')).getByText('Logout'));
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeTruthy();
    expect(localStorage.getItem('fitcloud_token')).toBeNull();
  });
});
