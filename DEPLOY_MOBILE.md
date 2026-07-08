# Deploying from just a phone (Termux + Spck Editor + Render)

Your stack works for this. Nothing here needs a laptop — here's the actual
role each tool plays, since none of them alone does the whole job:

| Tool | What it's for here |
|---|---|
| **Spck Editor** | Editing files comfortably, has built-in Git — good for tweaking code and committing |
| **Termux** | Running `git`, `npm install` (to sanity-check things locally), and pushing to GitHub |
| **GitHub** | The missing piece — Render deploys *from a Git repo*, not from your phone directly |
| **MongoDB Atlas** | Already cloud-hosted — no deployment step, just get the connection string |
| **Render** | Actually builds and runs your backend + frontend, 24/7, with a public URL |
| **Cloudinary** | Already cloud-hosted — just get your API keys |

Render pulls code from GitHub and builds it on Render's servers — your
phone never has to build or run the actual production app. Termux/Spck are
just how you edit and push the code.

## 1. Get this code onto GitHub (from your phone)

In Termux:
```bash
pkg install git
cd chat-app          # wherever you unzipped this project
git init
git add .
git commit -m "Initial commit"
```
Create an empty repo on github.com (the mobile site or app works fine),
then:
```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```
GitHub will ask for a **Personal Access Token** as your password (not your
account password) — generate one under GitHub Settings → Developer
settings → Personal access tokens.

From here on, use Spck Editor for any code edits (it has its own Git
panel too, so you can skip Termux for small changes — edit, stage, commit,
push, all from the app).

## 2. MongoDB Atlas (already cloud — just configure it)

1. console.mongodb.com → create a free (M0) cluster
2. **Database Access** → add a database user + password
3. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`)
   — you need this since Render's IPs aren't static
4. **Connect → Drivers** → copy the `mongodb+srv://...` URI, put your DB
   user's password into it

## 3. Cloudinary (already cloud — just grab keys)

Dashboard → copy **Cloud name**, **API Key**, **API Secret**.

## 4. Deploy on Render

Easiest path: use the `render.yaml` blueprint already in this repo.

1. Go to render.com → **New +** → **Blueprint**
2. Connect your GitHub account, pick this repo
3. Render reads `render.yaml` and proposes two services: `chat-backend`
   and `chat-frontend`
4. Before/after creating, fill in the env vars marked "fill in" in
   `render.yaml` for `chat-backend`: `MONGODB_URI`, `CLOUDINARY_*`
5. Deploy `chat-backend` first. Once it's live, copy its URL (e.g.
   `https://chat-backend.onrender.com`)
6. Set on `chat-backend`: `CLIENT_URL` = your frontend's URL (you'll know
   it once step 7 creates the service — Render lets you edit env vars
   and redeploy anytime)
7. Set on `chat-frontend`: `NEXT_PUBLIC_API_URL` = `https://chat-backend.onrender.com/api`
   and `NEXT_PUBLIC_SOCKET_URL` = `https://chat-backend.onrender.com`
8. Redeploy both once all URLs are known (Render → service → Manual Deploy)

No blueprint? You can add the two services by hand instead: **New + → Web
Service**, point at the repo, set **Runtime: Docker**, and Render will use
`backend/Dockerfile` / `frontend/Dockerfile` automatically if you set the
**Root Directory** to `backend` or `frontend` respectively.

## 5. Free-tier reality check

Render's free web services **spin down after 15 minutes idle** and take
~30–60 seconds to wake back up on the next request. That means:
- The first message/login after a period of inactivity will feel slow
- An idle Socket.IO connection can get dropped when the instance sleeps —
  the frontend will reconnect automatically once the backend wakes up, but
  there'll be a delay
- This is fine for testing/demoing; a paid Render plan removes it for real use

## 6. Test it

Visit your `chat-frontend` Render URL, register (check the **Render logs**
for `chat-backend` — under the "Logs" tab — for the printed OTP code,
since dev-mode OTP still just logs it rather than emailing/texting it
unless you've filled in `SMTP_*`/`TWILIO_*`), and try the voice commands
from a second device or browser tab logged in as a second account.

## Common mobile-deploy gotchas

- **Cookie doesn't stick / gets logged out immediately**: means
  `CROSS_SITE_COOKIES=true` isn't set on the backend, or `CLIENT_URL`
  doesn't exactly match your frontend's URL (no trailing slash).
- **CORS error in browser console**: same cause — `CLIENT_URL` must be
  the exact frontend origin.
- **Socket.IO won't connect**: double check `NEXT_PUBLIC_SOCKET_URL` has
  no trailing `/api` (that's only on the REST URL).
- **Git push fails from Termux with "authentication failed"**: you need a
  Personal Access Token, not your GitHub password (GitHub disabled
  password auth for git operations).
