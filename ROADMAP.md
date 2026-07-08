# Roadmap — what's real vs. what's next

This build focused entirely on making **login, ID search, chatting, and voice
commands** solid and genuinely functional. Everything below that scope
was intentionally left out rather than faked, so you know exactly what
you're getting.

## ✅ Fully built and working

- Email/mobile registration with OTP verification (console-logged in dev;
  wire up real SMTP/Twilio to go live) + password login
- JWT access tokens + httpOnly rotating refresh tokens
- Permanent unique numeric chat ID generated at signup
- Search by chat ID, username, or mobile (respecting privacy settings)
- One-to-one chat, real-time via Socket.IO
- Group chat creation (backend + API ready; minimal UI)
- Typing indicators, online/last-seen presence, read receipts, delivered status
- Message reactions, star, reply threading (data model + API), delete for
  me / delete for everyone, forward
- "Erase the chat" — both as a button and as a **voice command**
- Full voice command engine: default phrases for 11 actions, plus a
  settings-page UI to add your own custom trigger phrases per action
- Media upload endpoint (Cloudinary) — images, video, audio, voice notes,
  PDFs, Word docs, ZIPs
- Privacy settings (hide online status/last seen/photo/mobile, disable
  mobile search), block/unblock users
- Pin, archive, mute chats
- Theme settings (light/dark/AMOLED), rate limiting, bcrypt, Helmet, CORS,
  input sanitization against NoSQL injection and XSS

## 🧩 Scaffolded but not fully wired

- **Groups**: backend model + API are complete; the sidebar UI doesn't yet
  have a "create group" modal — the voice command for it currently just
  shows a toast pointing at a manual flow to build.
- **Message editing UI**: the schema supports `editedAt`; no edit button yet.

## 🚧 Not built — real scope for a future phase

- **Voice/video calls & screen sharing**: needs a WebRTC layer (e.g. a
  mediasoup/LiveKit SFU) plus signaling over Socket.IO. Nontrivial — plan
  for a dedicated phase.
- **True end-to-end encryption**: needs a client-side key-exchange protocol
  (e.g. Signal's X3DH/Double Ratchet via `libsignal`). What's here is
  transport security (HTTPS/WSS) and at-rest DB security, not E2E.
- **AI assistant** (summarize, translate, grammar, reply suggestions,
  reminders, image generation): needs an LLM API integration point in the
  message pipeline — straightforward to add, just out of scope here.
- **Admin dashboard**: user management, ban, analytics, storage usage —
  needs its own protected route tree and aggregation queries.
- **Push/desktop notifications, custom tones, scheduled DND**: needs a
  service worker + push subscription backend (this pairs naturally with
  the PWA work below).
- **QR code login, multi-device session list, self-destruct messages,
  polls, GIF/sticker picker, message scheduling, chat export/import,
  offline support, PWA manifest**: all reasonable additions, none started.
- **Two-factor authentication**: OTP-at-signup exists; a persistent 2FA
  toggle for every login does not.

## Suggested build order

1. Group chat UI (creation modal, member management) — reuses existing API
2. Message edit + polls (small, high value)
3. Push notifications + PWA manifest (unlocks "real app" feel)
4. Calls (biggest lift — budget real time for this)
5. AI assistant integration
6. Admin dashboard
7. E2E encryption (do this last and carefully — it changes how messages
   are stored and searched)
