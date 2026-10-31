// API smoke test: server chalta hona chahiye.
//   Terminal 1:  npm run dev
//   Terminal 2:  npm run test:api
// Ye har major endpoint ko asli HTTP calls se test karta hai (Node 18+ chahiye).
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

const check = (name, condition, extra = '') => {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`); }
  else { failed += 1; console.log(`  FAIL  ${name} ${extra}`); }
};

const call = async (method, path, { token, body, form } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const response = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await response.json() : Buffer.from(await response.arrayBuffer());
  return { status: response.status, data, headers: response.headers };
};

const registerForm = (fields, withFile) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  if (withFile) form.append('profileImage', new Blob([withFile.content], { type: withFile.type }), withFile.name);
  return form;
};

(async () => {
  const stamp = Date.now();
  const userA = { name: 'Test User A', email: `a${stamp}@test.com`, password: 'Strong@123', confirmPassword: 'Strong@123', fitnessLevel: 'Beginner' };
  const userB = { name: 'Test User B', email: `b${stamp}@test.com`, password: 'Strong@123', confirmPassword: 'Strong@123' };

  console.log('\nHEALTH');
  let r = await call('GET', '/health');
  check('GET /health returns 200', r.status === 200 && r.data.success);
  r = await call('GET', '/nothing-here');
  check('Unknown route returns 404', r.status === 404 && r.data.success === false);

  console.log('\nREGISTER');
  r = await call('POST', '/auth/register', { form: registerForm({ ...userA, password: 'weak', confirmPassword: 'weak' }) });
  check('Weak password rejected (400)', r.status === 400, JSON.stringify(r.data));
  r = await call('POST', '/auth/register', { form: registerForm({ ...userA, confirmPassword: 'Different@1' }) });
  check('Password mismatch rejected (400)', r.status === 400 && /match/i.test(r.data.message));
  r = await call('POST', '/auth/register', { form: registerForm({ ...userA, email: 'not-an-email' }) });
  check('Invalid email rejected (400)', r.status === 400);
  r = await call('POST', '/auth/register', { form: registerForm(userA) });
  check('Valid registration returns 201 + token', r.status === 201 && !!r.data.data.token && !r.data.data.user.password);
  const tokenA = r.data.data.token;
  r = await call('POST', '/auth/register', { form: registerForm(userA) });
  check('Duplicate email rejected (409)', r.status === 409);
  r = await call('POST', '/auth/register', { form: registerForm({ ...userB, email: `c${stamp}@test.com` }, { name: 'bad.gif', type: 'image/gif', content: 'GIF89a' }) });
  check('Wrong file type rejected (400)', r.status === 400 && /JPG|PNG|WEBP/.test(r.data.message), JSON.stringify(r.data));
  r = await call('POST', '/auth/register', { form: registerForm({ ...userB, email: `d${stamp}@test.com` }, { name: 'big.png', type: 'image/png', content: Buffer.alloc(3 * 1024 * 1024) }) });
  check('Large file rejected (400, size message)', r.status === 400 && /too large/i.test(r.data.message), JSON.stringify(r.data));
  r = await call('POST', '/auth/register', { form: registerForm(userB) });
  const tokenB = r.data.data.token;

  console.log('\nLOGIN + PROFILE');
  r = await call('POST', '/auth/login', { body: { email: userA.email, password: 'Wrong@1234' } });
  check('Wrong password returns 401', r.status === 401 && r.data.message === 'Invalid email or password');
  r = await call('POST', '/auth/login', { body: { email: userA.email, password: userA.password } });
  check('Login returns 200 + token', r.status === 200 && !!r.data.data.token);
  r = await call('GET', '/auth/profile', { token: tokenA });
  check('GET profile works', r.status === 200 && r.data.data.email === userA.email);
  r = await call('PUT', '/auth/profile', { token: tokenA, form: registerForm({ name: 'Renamed User', fitnessLevel: 'Advanced' }) });
  check('PUT profile updates name + level', r.status === 200 && r.data.data.name === 'Renamed User' && r.data.data.fitnessLevel === 'Advanced');
  r = await call('PUT', '/auth/profile', { token: tokenA, form: registerForm({ email: userB.email }) });
  check('Profile email already used returns 409', r.status === 409);

  console.log('\nAUTH PROTECTION');
  r = await call('GET', '/workouts');
  check('No token returns 401', r.status === 401);
  r = await call('GET', '/workouts', { token: 'invalid.token.value' });
  check('Invalid token returns 401', r.status === 401);

  console.log('\nWORKOUTS');
  r = await call('POST', '/workouts', { token: tokenA, body: { planName: '', type: 'Cardio', duration: 30 } });
  check('Empty plan name rejected (400)', r.status === 400);
  r = await call('POST', '/workouts', { token: tokenA, body: { planName: 'X', type: 'Dancing', duration: 30 } });
  check('Invalid type rejected (400)', r.status === 400);
  r = await call('POST', '/workouts', { token: tokenA, body: { planName: 'X', type: 'Cardio', duration: -5 } });
  check('Negative duration rejected (400)', r.status === 400);
  r = await call('POST', '/workouts', { token: tokenA, body: { planName: 'X', type: 'Cardio', duration: 30, progress: 150 } });
  check('Progress 150 rejected (400)', r.status === 400);
  const today = new Date().toISOString().slice(0, 10);
  r = await call('POST', '/workouts', { token: tokenA, body: { planName: 'Morning Run', type: 'Cardio', duration: 30, goal: 'Stamina', date: today } });
  check('Create workout returns 201', r.status === 201 && r.data.data.status === 'Not Started');
  const workoutId = r.data.data._id;
  await call('POST', '/workouts', { token: tokenA, body: { planName: 'Heavy Lifting', type: 'Strength', duration: 60, date: today } });
  r = await call('GET', '/workouts', { token: tokenA });
  check('List returns 2 workouts', r.status === 200 && r.data.count === 2);
  r = await call('GET', '/workouts?search=morning', { token: tokenA });
  check('Search by name works', r.data.count === 1 && r.data.data[0].planName === 'Morning Run');
  r = await call('GET', '/workouts?type=Strength', { token: tokenA });
  check('Filter by type works', r.data.count === 1);
  r = await call('GET', '/workouts?search=.*', { token: tokenA });
  check('Regex characters are escaped (no match)', r.data.count === 0);
  r = await call('GET', `/workouts/${workoutId}`, { token: tokenA });
  check('Get by id works', r.status === 200);
  r = await call('PUT', `/workouts/${workoutId}`, { token: tokenA, body: { progress: 55 } });
  check('Progress 55 auto-sets In Progress', r.status === 200 && r.data.data.status === 'In Progress');
  r = await call('PUT', `/workouts/${workoutId}`, { token: tokenA, body: { status: 'Completed' } });
  check('Status Completed auto-sets progress 100', r.data.data.progress === 100);
  r = await call('GET', `/workouts/${workoutId}`, { token: tokenB });
  check("Other user's workout returns 404", r.status === 404);
  r = await call('PUT', `/workouts/${workoutId}`, { token: tokenB, body: { planName: 'Hacked' } });
  check("Other user cannot update (404)", r.status === 404);
  r = await call('DELETE', `/workouts/${workoutId}`, { token: tokenB });
  check("Other user cannot delete (404)", r.status === 404);
  r = await call('GET', '/workouts/not-an-id', { token: tokenA });
  check('Invalid id returns 400', r.status === 400);
  r = await call('GET', '/workouts/64b7f0f0f0f0f0f0f0f0f0f0', { token: tokenA });
  check('Non-existing id returns 404', r.status === 404);
  r = await call('GET', '/workouts', { token: tokenB });
  check("User B sees none of A's workouts", r.data.count === 0);

  console.log('\nDIET');
  r = await call('POST', '/diet', { token: tokenA, body: { mealName: 'Oats', mealType: 'Breakfast', calories: 0 } });
  check('Zero calories rejected (400)', r.status === 400);
  r = await call('POST', '/diet', { token: tokenA, body: { mealName: 'Oats', mealType: 'Breakfast', calories: 350, date: today } });
  check('Create meal returns 201', r.status === 201);
  const mealId = r.data.data._id;
  await call('POST', '/diet', { token: tokenA, body: { mealName: 'Rice and chicken', mealType: 'Lunch', calories: 650, date: today } });
  await call('POST', '/diet', { token: tokenA, body: { mealName: 'Old meal', mealType: 'Dinner', calories: 500, date: '2020-01-01' } });
  r = await call('GET', '/diet?mealType=Lunch', { token: tokenA });
  check('Filter by meal type works', r.data.count === 1);
  r = await call('GET', `/diet?date=${today}`, { token: tokenA });
  check('Filter by date works', r.data.count === 2);
  r = await call('GET', `/diet/summary?date=${today}`, { token: tokenA });
  check('Nutrition summary totals', r.data.data.totalCalories === 1000 && r.data.data.Breakfast === 350 && r.data.data.Lunch === 650, JSON.stringify(r.data));
  r = await call('PUT', `/diet/${mealId}`, { token: tokenA, body: { calories: 400 } });
  check('Update meal works', r.status === 200 && r.data.data.calories === 400);

  console.log('\nEXERCISES');
  r = await call('POST', '/exercises', { token: tokenA, body: { name: 'Plank', type: 'Strength', duration: 0 } });
  check('Zero duration rejected (400)', r.status === 400);
  r = await call('POST', '/exercises', { token: tokenA, body: { name: 'Plank', type: 'Strength', duration: 5, description: 'Hold 60s' } });
  check('Create exercise returns 201', r.status === 201);
  const exerciseId = r.data.data._id;
  r = await call('GET', '/exercises?search=pla&type=Strength', { token: tokenA });
  check('Search + filter works', r.data.count === 1);
  r = await call('PUT', `/exercises/${exerciseId}`, { token: tokenA, body: { duration: 8 } });
  check('Update exercise works', r.data.data.duration === 8);

  console.log('\nPROGRESS');
  r = await call('POST', '/progress', { token: tokenA, body: { weight: -1 } });
  check('Negative weight rejected (400)', r.status === 400);
  await call('POST', '/progress', { token: tokenA, body: { weight: 80, workoutCompleted: 1, calories: 2000, progressPercentage: 20, date: '2026-10-01' } });
  r = await call('POST', '/progress', { token: tokenA, body: { weight: 79, workoutCompleted: 2, calories: 1900, progressPercentage: 40, date: today } });
  check('Create progress returns 201', r.status === 201);
  const progressId = r.data.data._id;
  r = await call('GET', '/progress?sort=asc', { token: tokenA });
  check('Progress list ascending', r.data.count === 2 && r.data.data[0].weight === 80);
  r = await call('PUT', `/progress/${progressId}`, { token: tokenA, body: { weight: 78.5 } });
  check('Update progress works', r.data.data.weight === 78.5);

  console.log('\nDASHBOARD');
  r = await call('GET', `/dashboard?date=${today}`, { token: tokenA });
  const d = r.data.data;
  check('Dashboard stats are real', r.status === 200 && d.stats.totalWorkouts === 2 && d.stats.completedGoals === 1 && d.stats.totalMeals === 3 && d.stats.totalExercises === 1, JSON.stringify(d && d.stats));
  check('Dashboard today widgets', d.todaysWorkouts.length === 2 && d.todaysDiet.meals.length === 2 && d.todaysDiet.summary.totalCalories === 1050);
  check('Dashboard progress summary + charts', d.progressSummary.latestWeight === 78.5 && d.progressSummary.weightChange === -1.5 && d.charts.weightTrend.length === 2);
  r = await call('GET', '/dashboard', { token: tokenB });
  check('User B dashboard is empty', r.data.data.stats.totalWorkouts === 0);

  console.log('\nCONTACT');
  r = await call('POST', '/contact', { body: { name: 'Visitor', email: 'bad', subject: 'Hi', message: 'Hello' } });
  check('Contact invalid email rejected (400)', r.status === 400);
  r = await call('POST', '/contact', { body: { name: 'Visitor', email: 'visitor@test.com', phone: '+92 300 1234567', subject: 'Question', message: 'How do reports work?' } });
  check('Contact message stored (201)', r.status === 201);

  console.log('\nREPORTS (Worker Thread)');
  r = await call('GET', '/reports/workouts?format=csv', { token: tokenA });
  const csv = r.data.toString();
  check('CSV report downloads', r.status === 200 && csv.includes('Plan Name') && csv.includes('Morning Run'));
  check('Report made by worker thread', r.headers.get('x-report-generated-by') === 'worker-thread' && Number(r.headers.get('x-worker-thread-id')) > 0);
  r = await call('GET', '/reports/diet?format=xlsx', { token: tokenA });
  check('XLSX report downloads (zip signature)', r.status === 200 && r.data[0] === 0x50 && r.data[1] === 0x4b);
  r = await call('GET', '/reports/export?type=all&format=xlsx', { token: tokenA });
  check('Export all (xlsx) works', r.status === 200 && Number(r.headers.get('x-report-rows')) >= 8);
  r = await call('GET', '/reports/export?type=exercises&format=csv', { token: tokenA });
  check('Export exercises (csv) works', r.status === 200 && r.data.toString().includes('Plank'));
  r = await call('GET', '/reports/progress?format=pdf', { token: tokenA });
  check('Invalid report format rejected (400)', r.status === 400);
  r = await call('GET', '/reports/workouts', { token: tokenB });
  check("User B report has only header (no A's data)", !r.data.toString().includes('Morning Run'));
  r = await call('GET', '/reports/workouts');
  check('Report without token returns 401', r.status === 401);

  console.log('\nDELETE');
  r = await call('DELETE', `/workouts/${workoutId}`, { token: tokenA });
  check('Delete workout works', r.status === 200);
  r = await call('GET', `/workouts/${workoutId}`, { token: tokenA });
  check('Deleted workout is gone (404)', r.status === 404);
  r = await call('DELETE', `/diet/${mealId}`, { token: tokenA });
  check('Delete meal works', r.status === 200);
  r = await call('DELETE', `/exercises/${exerciseId}`, { token: tokenA });
  check('Delete exercise works', r.status === 200);
  r = await call('DELETE', `/progress/${progressId}`, { token: tokenA });
  check('Delete progress works', r.status === 200);

  console.log('\nSECURITY');
  r = await call('POST', '/auth/login', { body: { email: { $gt: '' }, password: { $gt: '' } } });
  check('NoSQL injection login rejected (400)', r.status === 400);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((error) => { console.error('Test crashed:', error.message); process.exit(1); });
