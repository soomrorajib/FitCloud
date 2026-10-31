# FitCloud: Cloud-Based Fitness and Health Management System
### Cloud Computing Open-Ended Lab (OEL) Report

> Honesty note: this report only describes features that exist in the code. Items that depend on your own AWS/Atlas account (EC2, S3, Atlas screenshots, live URL) are marked **[to be completed by student]**.

---

## 1. Project Title
**FitCloud: Cloud-Based Fitness and Health Management System**

## 2. Introduction
FitCloud is a web application that lets users plan workouts, log meals, manage exercises, record body progress and export reports. It is a redesign of a simple PHP/MySQL fitness application (FitApp) into a modern **cloud-based distributed application**: a React single-page frontend, a Node.js/Express REST API, MongoDB Atlas as cloud database, AWS S3 as cloud file storage, and Node.js Worker Threads for heavy work.

## 3. Problem Statement
Fitness data is often kept in notebooks, chat messages or spreadsheets, so it is scattered, easy to lose and hard to analyse. A traditional monolithic PHP/MySQL site also mixes UI, logic and storage on one server, which makes it difficult to scale, secure and deploy in parts. Users need one secure, always-available place for their fitness data, and the system needs a cloud-ready architecture.

## 4. Objectives
1. Convert the FitApp idea into a cloud-based distributed application.
2. Expose all functions through a REST API using the MVC pattern.
3. Use MongoDB Atlas for data and AWS S3 for profile images (no images in the database).
4. Secure the system (JWT, bcrypt, validation, rate limiting, per-user data isolation).
5. Use Node.js Worker Threads for report generation.
6. Build a responsive, professional UI with real-data dashboards and charts.
7. Test the APIs (Postman, scripts) and prepare AWS deployment.

## 5. Proposed Solution
A three-tier cloud design: **React frontend** (hosted separately) ↔ **Express REST API** (on AWS EC2) ↔ **MongoDB Atlas + AWS S3**. The frontend never touches the database; it only calls the API with a JWT. Reports are produced by a worker thread so the API stays responsive. Frontend and backend are configured only by environment variables and can be deployed independently.

## 6. System Architecture
```
USER -> HTTPS -> REACT FRONTEND -> REST/JSON (JWT) -> NODE.JS + EXPRESS (MVC) -> MongoDB Atlas / AWS S3
```
Backend layers: **Routes** (URL → handler chain), **Middleware** (rate limit, auth, validation, upload, errors), **Controllers** (request logic), **Models** (Mongoose schemas), **Services** (S3, reports, nutrition totals), **Workers** (report thread). Diagram: `docs/architecture.svg`.

## 7. Cloud Architecture
| Component | Cloud service | Role |
|---|---|---|
| Backend API | AWS EC2 (Ubuntu) + Nginx + PM2 | runs the Node.js server, reverse proxy, auto restart |
| Database | MongoDB Atlas | managed document database with backups and network access control |
| File storage | AWS S3 | stores profile pictures; DB keeps only URL and key |
| Access control | AWS IAM | least-privilege permissions for S3 |
| Network | EC2 Security Group | only ports 22 (my IP), 80, 443 |
| Frontend | Vercel / Netlify / S3 + CloudFront | static hosting, deployed independently |

Why this is "cloud": managed services (Atlas, S3), stateless API (JWT, no server sessions, no local file storage) that can be copied to more servers behind a load balancer, configuration through environment variables, and separate deployment of each tier. **[Live URLs and AWS screenshots: to be completed by student]**

## 8. Technologies
React 18 + Vite, React Router, Axios, Recharts, custom CSS; Node.js, Express 4, Mongoose; MongoDB Atlas; AWS S3 SDK v3; JWT, bcrypt, Helmet, CORS, express-rate-limit, express-validator, express-mongo-sanitize; Multer, ExcelJS; Worker Threads; Postman/Newman; Git/GitHub; VS Code.

## 9. Functional Requirements
- FR1 Register with name, email, password, confirm password, fitness level and optional picture; duplicate emails rejected.
- FR2 Login with email and password; JWT issued; user name shown; private routes protected.
- FR3 View and edit profile (name, email, level, picture on S3).
- FR4 Workouts: create, list, view, edit, delete, search by name, filter by type/status, change status, track progress.
- FR5 Diet: create, list, view, edit, delete meals; filter by type and date; calorie totals per meal type.
- FR6 Exercises: create, list, view, edit, delete; search and filter by type.
- FR7 Progress: create, list, edit, delete; charts for weight, workouts, calories and progress %.
- FR8 Dashboard with totals, today's workout/diet, progress summary, charts and recent items from live data.
- FR9 Export workouts, diet, exercises, progress, or all as CSV/XLSX.
- FR10 Public pages: Home, About, Features, Contact (stored in DB), FAQ.
- FR11 Optional demo data via `npm run seed`.

## 10. Non-Functional Requirements
- **Security:** hashed passwords, token auth, per-user isolation, validation, rate limiting, secure headers.
- **Performance:** indexed queries (`userId` first), one aggregated dashboard call, worker threads for reports, debounced search.
- **Scalability:** stateless API, external DB and storage, separate frontend, worker pool limit.
- **Usability:** responsive layout, loading/empty/error states, confirmation dialogs, friendly messages.
- **Maintainability:** MVC folders, one API layer in the frontend, config through environment variables.
- **Portability:** runs locally and on AWS with only `.env` changes.
- **Reliability:** centralized error handling, S3 cleanup when a database save fails, PM2 auto restart.

## 11. Modules
1. Public website · 2. Registration · 3. Login and authentication · 4. Dashboard · 5. Workout management · 6. Diet management · 7. Exercise management · 8. Progress tracking · 9. Profile and S3 upload · 10. Contact · 11. FAQ · 12. Reports with worker thread · 13. Security, validation and error handling.

## 12. Database Design
Collections: `users`, `workouts`, `diets`, `exercises`, `progresses`, `contactmessages`. All have `createdAt/updatedAt`.

| Collection | Fields |
|---|---|
| users | name, email (unique), password (hash), fitnessLevel, profileImage, profileImageKey |
| workouts | userId, planName, description, type, duration, goal, status, progress, date |
| diets | userId, mealName, mealType, calories, description, date |
| exercises | userId, name, type, duration, description |
| progresses | userId, weight, workoutCompleted, calories, progressPercentage, date |
| contactmessages | name, email, phone, subject, message |

Relationship: every record in workouts/diets/exercises/progresses references its owner through `userId` (one user → many records). Indexes: unique `users.email`; compound `userId + createdAt/status/type/date/mealType` for the common queries. Note: Mongoose names the collection `progresses` (plural of Progress). Validation is also enforced in the schema (enums, min/max).

## 13. REST API Design
Resource-based URLs, standard verbs (GET, POST, PUT, DELETE), JSON bodies, uniform responses `{success, message, data}` and meaningful status codes (200, 201, 400, 401, 404, 409, 429, 503, 500). Resources: `/auth`, `/workouts`, `/diet`, `/exercises`, `/progress`, `/contact`, `/dashboard`, `/reports`. The full table is in `README.md`. Search and filters use query strings (`?search=&type=&status=`).

## 14. MVC Architecture
- **Model:** Mongoose schemas in `models/` define data, validation and indexes.
- **View:** the React frontend (JSON is the API's "view"; the browser UI renders it).
- **Controller:** `controllers/` receive validated requests, use models and services, and send JSON.
- **Supporting layers:** `routes/` map URLs to controllers, `middleware/` handles cross-cutting work, `services/` contains reusable logic (S3, reports), `server.js` only wires everything.

Example: `POST /api/workouts` → `workoutRoutes` → `protect` (auth) → `workoutRules` + `validate` → `createWorkout` controller → `Workout` model → MongoDB.

## 15. Authentication and Security
- **bcrypt** hashes passwords (10 rounds); hashes are never returned.
- **JWT** signed with `JWT_SECRET`; sent as `Authorization: Bearer <token>`; verified by `authMiddleware.js` → 401 on failure.
- **Authorization:** every query is filtered by `userId`; another user's resource returns 404 (so its existence is not leaked). Only whitelisted fields are accepted.
- **Validation** at the frontend (user experience) and backend (real protection).
- **Helmet**, **CORS** (only `CLIENT_URL`), **rate limiting** (global 300/15 min, login/register 20/15 min, contact 10/hour).
- **NoSQL injection:** `express-mongo-sanitize`, type-checked validators, escaped regex search.
- **Uploads:** only JPG/PNG/WEBP, max 2 MB, checked by mimetype and extension; kept in memory, sent to S3.
- **Exports:** cells starting with `= + - @` are neutralised (CSV formula injection).
- **Secrets:** environment variables only; `.env` is git-ignored.
- **Token storage trade-off:** the token is kept in `localStorage` (simple, works across separate frontend/backend domains) but is exposed if the site suffers XSS; httpOnly cookies avoid that but need CSRF protection. Listed as future work.

## 16. Multithreading
Node.js runs JavaScript on one main thread. Building a large XLSX/CSV is CPU work that would block every other request. FitCloud uses `worker_threads`:

1. `reportController` receives `GET /api/reports/...` and calls `reportService`.
2. `reportService` reads the user's data from MongoDB (async I/O, does not block) and sends it to a **worker pool** (max 2 threads, extra jobs wait in a queue, 30 s timeout).
3. `workers/reportWorker.js` formats rows, escapes CSV or builds and styles the XLSX workbook, and sends the buffer back.
4. The controller returns the file with headers `X-Report-Generated-By: worker-thread` and `X-Worker-Thread-Id`.

The Reports page shows the thread id and time after each download. The worker is used for every report; it is not placeholder code. Note: with small datasets the speed gain is small, and the benefit is keeping the event loop free as data grows.

## 17. AWS Deployment
Documented in `docs/AWS_DEPLOYMENT.md`: launch Ubuntu EC2, security group (22/80/443), Elastic IP, install Node.js 20, Git, Nginx, PM2, clone repo, create `.env`, `pm2 start ecosystem.config.js`, Nginx reverse proxy, HTTPS with Let's Encrypt, Atlas network access for the Elastic IP. The backend starts with `npm start`. **[Actual deployment and screenshots: to be completed by student]**

## 18. S3 Storage
Flow: user selects image → frontend validates → API (`multipart/form-data`, Multer in memory) → type and size checks → `s3Service` uploads `profile-images/<userId>/<timestamp>-<random>.<ext>` → URL returned → saved in the user document. Large files are never stored in MongoDB. If the database save fails, the new S3 object is deleted; when a picture is replaced the old object is deleted. Bucket policy makes only `profile-images/*` readable; the backend IAM user can only `PutObject` and `DeleteObject` there. Without AWS settings, registration works without a picture and an upload returns a clear 503.

## 19. MongoDB Atlas
Managed cloud database (M0 free tier). Connection string in `MONGODB_URI`; access limited by a database user and **Network Access** IP list (developer IP, EC2 Elastic IP). Mongoose creates collections and indexes automatically. Aggregation is used for calorie totals and dashboard status counts. If Atlas is unreachable at start, the server logs the reason and exits instead of running half-working.

## 20. Testing
Tests were run during development against a **local MongoDB 7.0** and a **mock S3 server** (not real Atlas/AWS). Please re-run them on your setup for your screenshots.

| Test | Tool | Result (during development) |
|---|---|---|
| API smoke test (`npm run test:api`) | Node script, real HTTP | 68 checks passed: validation, auth 401, ownership 404, CRUD, search/filter, dashboard, contact, reports, NoSQL-injection login |
| Postman collection (8 folders) | Newman | 38 requests, 48 assertions, 0 failures |
| UI flow test (`npm run test:ui`) | Vitest + jsdom against real backend | 16 tests passed: public pages, FAQ, forms, register, login errors, protected route, workout/diet/exercise/progress CRUD, search, reports download, profile update, expired token, logout |
| S3 flow | mock S3 endpoint | register upload, replace picture (old one deleted), missing-config 503 verified |
| Seed script | `npm run seed` | demo user + 8 workouts, 12 meals, 7 exercises, 14 progress entries |
| Manual browser testing | Chrome | **[to be completed by student]** (responsive layout, visual check, real S3/Atlas) |

Not verified in this project: a real AWS EC2/S3/Atlas deployment, load/performance testing, and automated accessibility tests.

## 21. Screenshots
Insert the 23 screenshots listed in `screenshots/README.md`. **[to be completed by student]**

## 22. Challenges
1. **Keeping one user's data private.** Forgetting a filter in one query would leak data.
2. **Image uploads leaving orphan files.** Uploading before a database failure leaves unused S3 objects.
3. **Heavy report generation blocking the server.**
4. **Dates shifting by one day** between browser time zones and the server.
5. **Workout status and progress contradicting each other** (for example Completed at 40%).
6. **CORS and custom headers** for downloads from a separately hosted frontend.
7. **Session expiry** handled consistently across many pages.
8. **Mongoose validation failures** and database errors returning inconsistent messages.
9. **HTTPS requirement:** an https frontend cannot call an http API.

## 23. Solutions
1. Every controller filters by `req.user._id`, fields are whitelisted, and a test checks that user B cannot read, change or delete user A's data.
2. Duplicate email is checked and validation done **before** the S3 upload; on a database error the uploaded file is deleted.
3. Worker thread pool for report building.
4. Dates are stored at UTC midnight, the frontend sends the user's local `YYYY-MM-DD`, and displays in UTC.
5. A single rule (Completed ⇒ 100%, 100% ⇒ Completed, progress above 0 ⇒ In Progress) is applied in both the form and the controller.
6. `exposedHeaders` in CORS config; allowed origins from `CLIENT_URL`.
7. Axios interceptor emits an event on 401; `AuthContext` clears the token, shows "Session expired. Please login again." and the protected route redirects to login.
8. One `errorMiddleware` maps Mongoose, duplicate-key, JWT, Multer and JSON errors to `{ success:false, message }`.
9. Nginx + Let's Encrypt (documented), or CloudFront.

## 24. Conclusion
FitCloud meets the project goal of turning a simple PHP/MySQL fitness app into a cloud-ready distributed application. It has a separate React frontend, an MVC REST API, MongoDB Atlas, AWS S3 storage, JWT-based security, per-user data isolation, and worker-thread report generation, together with tests, Postman collection and a deployment guide for AWS.

## 25. Future Enhancements
Goals module and reminders; refresh tokens and httpOnly cookies; private S3 with pre-signed URLs or CloudFront; PDF reports and report history; a job queue (SQS) for very large reports; load balancer with several instances or containers (ECS); CI/CD with GitHub Actions; pagination; email verification and password reset; monitoring with CloudWatch; dark mode and PWA support.
