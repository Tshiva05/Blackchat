# Chat App — Login · ID Search · Real-Time Chat · Voice Commands

A real, runnable full-stack chat app: Node/Express + Socket.IO + MongoDB
Atlas backend, Next.js/TypeScript/Tailwind frontend. See `ROADMAP.md` for
exactly what's fully built vs. what's a documented next step (calls, video,
AI assistant, admin dashboard, E2E encryption, etc.).

**Deploying from just a phone (Termux + Spck Editor + Render)?** See
`DEPLOY_MOBILE.md` — it covers the exact workflow and a `render.yaml`
blueprint so you don't have to hand-configure build commands.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (Mongoose)
- **Real-time**: Socket.IO
- **Auth**: JWT access tokens + httpOnly rotating refresh tokens, OTP-verified signup
- **Media**: Cloudinary
- **Voice**: Web Speech API (browser-native, no external service)

## Project structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── config/       # env loader, MongoDB connection
│   │   ├── models/       # User, Chat, Message, OtpToken
│   │   ├── middleware/    # auth, rate limiting, error handling
│   │   ├── controllers/  # auth, users, chats, messages
│   │   ├── routes/       # REST route definitions
│   │   ├── sockets/      # Socket.IO event handlers
│   │   ├── utils/        # ID generation, tokens, OTP delivery, Cloudinary
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/           # login, register, chat, settings pages
│   │   ├── components/    # ChatWindow, MessageBubble, SearchBar, IdCard, VoiceCommandBar
│   │   ├── context/       # Auth + Socket providers
│   │   ├── lib/           # API client, socket client, voice command engine
│   │   └── types/
│   ├── package.json
│   ├── .env.local.example
│   └── Dockerfile
├── docker-compose.yml
└── ROADMAP.md
```

## 1. Set up MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Under **Database Access**, create a user with a password
3. Under **Network Access**, allow your IP (or `0.0.0.0/0` for quick local dev)
4. Under **Connect → Drivers**, copy the connection string — it looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/chatapp?retryWrites=true&w=majority`

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: paste your MONGODB_URI, set real JWT secrets
npm install
npm run dev
```

The API runs on `http://localhost:5000`. Health check: `GET /api/health`.

**About OTP delivery**: in development, OTP codes are printed to the
backend console instead of actually being emailed/texted — there's no
paid SMS/email account wired up by default. To go live:
- Email: fill in `SMTP_*` in `.env` (any SMTP provider works, e.g. a Gmail
  app password or SendGrid's SMTP relay)
- SMS: fill in `TWILIO_*` in `.env` and uncomment the Twilio block in
  `src/utils/sendOtp.js`

**About media uploads**: fill in `CLOUDINARY_*` in `.env` (free tier is
fine) to enable image/video/file uploads.

## 3. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## 4. Try it out

1. Go to `/register`, enter an email or mobile number
2. Check the **backend terminal** for the printed OTP code (dev mode)
3. Verify, pick a username and password — you'll land on `/chat` with a
   permanent numeric chat ID shown in the sidebar
4. Open a second browser (or incognito window), register a second account
5. In one window, search the other account's chat ID and start chatting —
   messages arrive in real time
6. Click the mic icon and try saying: **"erase the chat"**, **"send hello
   there"**, **"search &lt;the other user's ID&gt;"**, **"dark mode"**
7. Go to **Settings → Voice commands** to teach custom trigger phrases,
   e.g. make "Destroy" also erase the chat

## Voice commands reference

| Say | Does |
|---|---|
| "erase the chat" / "clear the chat" | Clears the open conversation (for you) |
| "search &lt;id or name&gt;" | Opens a chat with that user |
| "send &lt;message&gt;" | Sends a text message |
| "dark mode" | Toggles the theme |
| "open settings" | Navigates to Settings |
| "mute notifications" | Mutes the open chat |
| "log out" | Signs out |

All of these are customizable per-user in Settings — add your own phrases
on top of the defaults.

## Docker

```bash
cp backend/.env.example backend/.env   # fill in real values first
docker compose up --build
```

This builds and runs both services. MongoDB stays on Atlas (cloud), so
there's no local Mongo container — see the comment in `docker-compose.yml`
if you'd rather run Mongo locally instead.

## Security notes

- Passwords hashed with bcrypt (cost factor 12)
- Refresh tokens are rotated on every use and stored server-side only as
  hashes, not plaintext
- Rate limiting on all API routes, with a tighter limit on OTP requests
- `express-mongo-sanitize` and `xss-clean` on all input
- Helmet for standard security headers
- CORS locked to `CLIENT_URL`

## What's not included

See `ROADMAP.md` for the full breakdown — short version: voice/video
calls, true end-to-end encryption, the AI assistant, and the admin
dashboard are documented as next phases, not built here.
