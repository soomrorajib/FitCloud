# FitCloud: Viva Questions and Answers

Answers are written in simple language and match what is really implemented in this project.

---

**1. Why is this a cloud-based application?**
Because each part runs as a separate cloud service: the frontend is hosted separately, the API runs on AWS EC2, data is in MongoDB Atlas (managed cloud database) and pictures are in AWS S3. The API keeps no files or sessions on its own server, so it can be copied to more servers when users increase.

**2. What is a REST API?**
A way for programs to talk over HTTP using URLs and standard methods (GET to read, POST to create, PUT to update, DELETE to remove). Data is exchanged as JSON. Example: `GET /api/workouts`.

**3. Why did you use REST?**
It separates frontend and backend completely, so the same API can serve a website or a mobile app. It is simple, uses standard HTTP status codes, is stateless, and is easy to test with Postman.

**4. What is MVC?**
Model-View-Controller. The Model handles data, the View shows it to the user, and the Controller connects them by handling requests.

**5. Explain your MVC architecture.**
Models are Mongoose schemas in `models/` (User, Workout, Diet and so on). Controllers in `controllers/` contain the request logic. Routes in `routes/` connect URLs to controllers. The View is the React frontend, which displays the JSON the API returns. Extra folders: `middleware/` (auth, validation, errors), `services/` (S3, reports) and `workers/`. `server.js` only sets things up.

**6. Why MongoDB Atlas?**
It is a managed cloud database, so I do not install or maintain a database server. It has a free tier, backups, and IP-based access control. MongoDB's flexible documents fit JSON APIs well, and it works easily with Node.js through Mongoose.

**7. What is AWS EC2?**
Elastic Compute Cloud: virtual servers (Linux machines) that you rent on AWS. I use one to run the Node.js backend.

**8. What is AWS S3?**
Simple Storage Service: cloud storage for files (objects) kept in buckets. It is very durable and scales automatically.

**9. Why use S3?**
Storing images inside MongoDB makes the database big and slow. S3 is built for files and is cheaper. The database stores only the image URL and key, so it stays small.

**10. What is JWT?**
JSON Web Token: a signed text token that proves who the user is. It has three parts (header, payload, signature). After login the server gives it to the client, and the client sends it with each request. The server checks the signature using `JWT_SECRET`.

**11. Why bcrypt?**
Passwords must never be stored as plain text. bcrypt turns a password into a one-way hash with a random salt and is intentionally slow, so guessing passwords is very hard even if the database leaks.

**12. How is security implemented?**
bcrypt for passwords, JWT for login, an auth middleware on private routes, every query filtered by the user's id, input validation on frontend and backend, Helmet headers, CORS limited to my frontend, rate limiting, protection from NoSQL injection, file type/size checks, and secrets kept in environment variables.

**13. What is multithreading?**
Doing several tasks at the same time using more than one thread. Node.js normally uses one main thread, so a long CPU task can block everything. Worker threads give extra threads for such tasks.

**14. Where is multithreading used?**
In report generation. `workers/reportWorker.js` builds the CSV or XLSX file when a user exports data.

**15. Why Worker Threads?**
Building a big Excel file is CPU-heavy. If done on the main thread, other users' requests (login, dashboard) would wait. A worker thread does that job separately, so the server stays responsive. I also limit the pool to 2 workers so too many threads are not created.

**16. What happens if a user accesses another user's workout?**
They get **404 Workout not found**. Every query includes both the record id and the logged-in user's id, so another user's record is never found. I tested this: user B cannot read, update or delete user A's workout.

**17. How does the frontend communicate with the backend?**
Through REST APIs using Axios. The base URL comes from `VITE_API_URL`. An Axios interceptor adds the `Authorization: Bearer <token>` header to every request.

**18. How does the backend communicate with MongoDB?**
Through Mongoose, using the connection string in `MONGODB_URI` (the `mongodb+srv` URL from Atlas). Mongoose models send queries to Atlas over the internet.

**19. What happens during login?**
The user sends email and password. The server finds the user by email, compares the password with the stored bcrypt hash, and if correct signs a JWT and returns it. The frontend saves it, loads the dashboard and shows the user's name. If wrong, the server returns 401 "Invalid email or password".

**20. How does authentication work?**
For protected routes `authMiddleware.js` reads the `Authorization` header, verifies the JWT, loads the user from the database and puts it in `req.user`. Missing, invalid or expired tokens get 401, and the frontend sends the user to the login page.

**21. How is the profile image uploaded?**
The user picks an image, and the frontend checks type and size. It is sent as `multipart/form-data` to the API. Multer keeps it in memory, the server validates it again (JPG/PNG/WEBP, max 2 MB), uploads it to S3, and saves only the S3 URL and key in the user document.

**22. How are APIs tested?**
With a Postman collection (38 requests with automatic test scripts, including negative cases), a Node smoke-test script (`npm run test:api`), and an optional UI test. I test valid data, invalid data, missing token, invalid token and non-existing records.

**23. What happens if MongoDB is unavailable?**
At startup the server logs the error and exits, so it does not run in a broken state (PM2 can restart it). If the database goes down while running, requests fail with a 500 error and a safe message, and Mongoose reconnects automatically when the database returns.

**24. What is distributed architecture?**
A system whose parts run on different machines and talk over a network. FitCloud's frontend, API, database and file storage are separate and communicate over HTTPS.

**25. How can this system scale?**
The API is stateless (JWT, no local files), so I can run several copies behind a load balancer. Atlas can be upgraded or sharded and S3 scales automatically. Report building can be moved to a job queue. The frontend can sit on a CDN.

**26. What are the advantages of cloud deployment?**
Pay for what you use, easy scaling, no hardware to buy, high availability, managed backups and security tools, access from anywhere, and fast deployment.

**27. What are the limitations?**
The token is kept in localStorage (exposed if the site has an XSS bug). Pictures are public-read. There is one EC2 server (single point of failure), no refresh tokens, no email verification, reports are limited to one server's workers, and the free tiers have limits. Also, I have not done load testing.

**28. How can AWS deployment be improved?**
Use an Application Load Balancer with Auto Scaling, put CloudFront in front, use an IAM role instead of access keys, keep secrets in AWS Secrets Manager, use Docker and ECS or Elastic Beanstalk, add CloudWatch monitoring, and set up CI/CD with GitHub Actions.

**29. What is CORS?**
Cross-Origin Resource Sharing. Browsers block a website from calling an API on a different domain unless the API allows it. My backend allows only the origin in `CLIENT_URL`, so other websites cannot call it from a browser.

**30. Why are environment variables important?**
They keep secrets (database password, JWT secret, AWS keys) out of the source code and GitHub, and let the same code run in development and production with different settings. `.env` is git-ignored and `.env.example` shows the required names.

**31. What is the difference between authentication and authorization?**
Authentication checks **who you are** (login and JWT). Authorization checks **what you may access** (you can only access records with your own userId).

**32. Why do you check duplicate email before uploading the image?**
So we do not upload a file to S3 for a request that will fail. If the database save still fails after upload, the code deletes the uploaded file.

**33. How is user input validated?**
On the frontend for quick feedback, and on the backend with express-validator and Mongoose schema rules for real protection. Examples: duration must be positive, progress between 0 and 100, strong password.

**34. How do you prevent brute-force attacks and spam?**
Rate limiting: login/register allow 20 attempts per 15 minutes per IP, the contact form 10 per hour, and the whole API 300 per 15 minutes.

**35. What is the role of Nginx and PM2 on EC2?**
Nginx receives public traffic on ports 80/443 and forwards it to Node on port 5000, which is not exposed publicly. PM2 keeps the Node process running, restarts it if it crashes and starts it after a reboot.

**36. How does the dashboard get its data without hardcoding?**
One call to `GET /api/dashboard` runs several database queries together (counts, aggregation, recent records). The frontend only displays the result.

**37. What is MongoDB injection and how do you stop it?**
An attacker sends operators like `{"$gt": ""}` instead of text to bypass checks. I stop it with `express-mongo-sanitize`, validators that require strings and numbers, and by escaping regex in search. I tested a login attempt with such a body and it was rejected.

**38. Why did you choose React for the frontend?**
Component-based UI, a large ecosystem (React Router, Recharts), and a single-page app that talks to the API only through REST, so it can be deployed independently on any static host.
