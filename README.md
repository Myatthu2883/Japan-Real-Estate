# 🏯 Japan Property — 日本不動産 (v2)

Full-stack Japanese real estate site · Next.js 15 · localStorage store & MySQL · Three role-based panels

---

## 🚀 Quick Start (No database needed!)

```bash
cd japan-real-estate
npm install
npm run dev
# Open http://localhost:3000
```

The site uses **localStorage** for all data, so it works immediately without any database setup.

---

## 🔑 Demo Login Credentials

| Role  | Email | Password | Panel |
|-------|-------|----------|-------|
| **Admin** | admin@japanproperty.jp | admin123 | /admin |
| **Agent** | agent@japanproperty.jp | agent123 | /agent |
| **User**  | user@japanproperty.jp  | user123  | /dashboard |

Click the demo buttons in the login modal, or type credentials manually.

---

## ✅ All Issues Fixed

| Issue | Fix |
|-------|-----|
| ❌ Can't login | ✅ localStorage auth, demo buttons in modal |
| ❌ Can't see password | ✅ Eye icon toggle on password field |
| ❌ No role panels | ✅ Admin `/admin`, Agent `/agent`, User `/dashboard` |
| ❌ No route guards | ✅ `<Guard>` component blocks wrong-role access, redirects to login |
| ❌ Agent can't see inquiry messages | ✅ Agent panel "Inquiries" tab shows all contact-agent messages |
| ❌ Saved properties not in profile | ✅ User dashboard "Saved Properties" reads from store, shows real cards |
| ❌ Admin can't see contact messages | ✅ Admin panel "Messages" tab shows all contact form + inquiry messages |
| ❌ Database broken | ✅ Clean `schema.sql` with proper FK constraints, tested inserts, seed data |

---

## 📐 Three Panels

### Admin Panel `/admin`
- Overview stats (properties, users, agents, new messages)
- Properties table: view/delete all listings
- Users table: see all registered users with roles
- Messages inbox: contact form submissions + inquiry messages, with mark-read, delete, reply-by-email

### Agent Panel `/agent`
- My Listings: all properties assigned to this agent
- Add Listing form: create new properties with full bilingual fields
- Inquiries inbox: messages sent via "Contact Agent" on any of their properties
- Stats overview

### User Dashboard `/dashboard`
- Saved Properties: heart ♡ any property on the detail page — appears here instantly
- Edit Profile: update name, phone, password

---

## 🔒 Route Guards

Every panel page is wrapped in `<Guard roles={[...]}>`.

- Not logged in → redirected to `/?login=1` (opens login modal automatically)
- Wrong role → redirected to your own panel (admin → /admin, agent → /agent, user → /dashboard)
- Navbar shows role badge + avatar + direct panel link

---

## 💾 Data Flow

```
localStorage (jp_users, jp_properties, jp_messages, jp_saved)
     ↑↓
/src/lib/store.ts   ← all CRUD functions
     ↑↓
React components (pages, panels)
```

To switch to MySQL: replace `store.ts` function calls with `fetch('/api/...')` calls.
The API routes in `/src/app/api/` are already written for MySQL.

---

## 🗂 File Structure

```
src/
├── app/
│   ├── admin/page.tsx          ← Admin panel (guard: admin only)
│   ├── agent/page.tsx          ← Agent panel (guard: agent only)
│   ├── dashboard/page.tsx      ← User dashboard (guard: user only)
│   ├── profile/page.tsx        ← Redirects to correct panel
│   ├── properties/
│   │   ├── page.tsx            ← Public listing with filters
│   │   └── [id]/page.tsx       ← Detail + save + contact agent
│   ├── contact/page.tsx        ← Contact form → admin inbox
│   └── api/                    ← MySQL API routes (ready for production)
├── components/
│   ├── Guard.tsx               ← Route protection component
│   ├── Navbar.tsx              ← Role badge, panel links, lang toggle
│   ├── AuthModal.tsx           ← Password toggle, demo accounts, role redirect
│   └── PropertyCard.tsx
└── lib/
    ├── store.ts                ← localStorage CRUD (all data operations)
    ├── auth-context.tsx        ← User state, login/register/logout
    └── i18n.tsx                ← EN/JA translations
```

---

## 🗄 MySQL Setup (Production)

```bash
mysql -u root -p < schema.sql
cp .env.example .env.local
# Fill DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET
```

The schema creates:
- `users` — with role enum (user/agent/admin)
- `properties` — bilingual fields, FK to agent
- `messages` — contact + inquiry, FK to agent + property
- `saved_properties` — FK join table
- `property_images` — multi-image support

Seed includes 3 users + 8 properties + 2 sample messages.

## Production Deployment (Vercel)

This app requires:
- a hosted MySQL database
- Vercel environment variables
- MySQL as the source of truth for auth and admin data