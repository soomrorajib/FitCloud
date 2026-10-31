# FitCloud: AWS and cloud deployment guide

This guide deploys the **backend on AWS EC2**, the **database on MongoDB Atlas**, the **profile pictures on AWS S3** and the **frontend separately** (Vercel, Netlify, or S3 + CloudFront).

> Status: the application code is ready for this deployment and was tested locally. The AWS and Atlas steps below are instructions for you to carry out. Take your own screenshots (EC2, S3, Atlas) as you go.

Order of work: **1. Atlas → 2. S3 + IAM → 3. EC2 backend → 4. HTTPS → 5. Frontend → 6. Final check**

---

## 1. MongoDB Atlas

1. Create a free **M0** cluster (provider AWS, a region close to your EC2 region).
2. **Database Access**: add a user with a password that has no `@ : /` characters. Role: *Read and write to any database*.
3. **Network Access**: for local work add your IP. For EC2 add the EC2 **Elastic IP** (step 3.2). Avoid `0.0.0.0/0` in production.
4. **Connect > Drivers**: copy the connection string and put the database name in it:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/fitcloud?retryWrites=true&w=majority`

## 2. AWS S3 and IAM (profile pictures)

### 2.1 Create the bucket
1. S3 > **Create bucket**. Name it e.g. `fitcloud-profile-images-yourname`, choose your region (e.g. `ap-south-1`).
2. Keep **ACLs disabled** (default). The app does not use ACLs.
3. Uncheck **Block all public access** (you only need to allow bucket policies), tick the warning box, create the bucket.

### 2.2 Allow the profile pictures to be viewed
Bucket > **Permissions > Bucket policy** (replace the bucket name). Only the `profile-images/` folder becomes public-read:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadProfileImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/profile-images/*"
    }
  ]
}
```

> More private alternative: keep the bucket fully private and serve images through CloudFront or pre-signed URLs. FitCloud currently stores a plain public URL, so that option would need extra code.

### 2.3 Create an IAM user for the backend
IAM > Users > **Create user** (e.g. `fitcloud-backend`) > attach this inline policy (least privilege):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/profile-images/*"
    }
  ]
}
```

Create an **access key** (use case: application running outside AWS) and keep the two values for `.env`. Never commit them.

> Better on EC2: attach an **IAM Role** with the same policy to the instance and leave `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` empty. The AWS SDK then picks up the role credentials automatically.

## 3. EC2 backend

### 3.1 Launch the instance
- AMI: **Ubuntu Server 22.04 or 24.04 LTS**, type **t2.micro / t3.micro** (free tier).
- Create a **key pair** (`fitcloud.pem`) and download it.
- **Security group** inbound rules:

| Type | Port | Source | Why |
|---|---|---|---|
| SSH | 22 | **My IP** | admin login |
| HTTP | 80 | 0.0.0.0/0 | Nginx / Let's Encrypt |
| HTTPS | 443 | 0.0.0.0/0 | secure API |

Do **not** open port 5000 publicly. Nginx forwards to it internally.

### 3.2 Elastic IP
EC2 > Elastic IPs > Allocate > Associate with the instance. Add this IP to Atlas Network Access.

### 3.3 Connect and install software
```bash
chmod 400 fitcloud.pem
ssh -i fitcloud.pem ubuntu@YOUR_ELASTIC_IP

sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v && git --version
sudo npm install -g pm2
```

### 3.4 Get the code and configure it
```bash
git clone https://github.com/YOUR-USER/FitCloud.git
cd FitCloud/backend
npm install --omit=dev
cp .env.example .env
nano .env
```
Fill in `.env` (production values):
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/fitcloud?retryWrites=true&w=majority
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
AWS_REGION=ap-south-1
AWS_S3_BUCKET=YOUR-BUCKET-NAME
# AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY only if you do NOT use an IAM role
```
Generate the secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### 3.5 Start with PM2 (keeps running after you log out and after reboot)
```bash
pm2 start ecosystem.config.js
pm2 status
pm2 logs fitcloud-api --lines 20       # should show "MongoDB Atlas connected" and "running on port 5000"
pm2 save
pm2 startup                              # run the command it prints, then: pm2 save
curl http://localhost:5000/api/health    # should return success: true
```
You can also run it with plain `npm start`.

### 3.6 Nginx reverse proxy
```bash
sudo nano /etc/nginx/sites-available/fitcloud
```
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    client_max_body_size 3m;   # profile pictures are max 2 MB

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/fitcloud /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
curl http://YOUR_ELASTIC_IP/api/health
```

## 4. HTTPS (required)

A frontend served over **https** cannot call an **http** API (browsers block "mixed content"). So the API needs HTTPS too.

Option A (recommended): get a free domain name (a real domain, or a free one from DuckDNS) pointing to your Elastic IP, set it as `server_name` in Nginx, then:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```
Option B: put **CloudFront** in front of the EC2 origin to get an HTTPS URL without owning a domain (more setup).

Your API URL is then `https://api.yourdomain.com/api`.

## 5. Frontend (deployed separately)

Set the environment variable **`VITE_API_URL=https://api.yourdomain.com/api`** at build time.

### Vercel or Netlify (easiest)
1. Push the repo to GitHub.
2. Import the project, set **Root directory** to `frontend`, build command `npm run build`, output `dist`.
3. Add the environment variable `VITE_API_URL`.
4. Because this is a single-page app, add a rewrite so refreshing `/dashboard` works:
   - Vercel: add `frontend/vercel.json` with `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`
   - Netlify: add `frontend/public/_redirects` with `/*  /index.html  200`
5. Copy the final site URL and put it in `CLIENT_URL` on the EC2 `.env`, then `pm2 restart fitcloud-api`.

### S3 + CloudFront (all-AWS option)
Build locally (`npm run build`), upload `dist/` to a second S3 bucket with static hosting behind CloudFront, and set CloudFront custom error responses 403/404 to `/index.html` with status 200.

## 6. Final check

- `https://api.yourdomain.com/api/health` returns `success: true`
- Register on the live frontend, upload a picture, see the object appear in the S3 bucket under `profile-images/`
- New documents appear in Atlas (Browse Collections)
- Import `postman/FitCloud-AWS.postman_environment.json`, set `baseUrl`, run the collection
- Screenshots: EC2 instance running, security group rules, S3 bucket with objects, Atlas collections

## Updating the server later
```bash
cd ~/FitCloud && git pull
cd backend && npm install --omit=dev
pm2 restart fitcloud-api
```

## Troubleshooting (common)
| Symptom | Cause | Fix |
|---|---|---|
| `MongoDB connection failed ... timed out` | EC2 IP not in Atlas Network Access | add the Elastic IP |
| Browser: CORS error | `CLIENT_URL` does not exactly match the frontend URL | fix `.env`, `pm2 restart` |
| Browser: mixed content blocked | API is http while site is https | set up HTTPS (step 4) |
| `Image upload is not configured` (503) | AWS values missing in `.env` | fill AWS_REGION and AWS_S3_BUCKET (and keys or a role) |
| `AccessDenied` on upload | IAM policy / bucket name wrong | check the policy resource ARN |
| Image URL opens but shows AccessDenied | bucket policy missing | add the public-read policy (step 2.2) |
| 413 on upload | Nginx body limit | `client_max_body_size 3m;` |
