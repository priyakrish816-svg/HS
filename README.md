# harising.cloud: deploy on Coolify

This folder is the complete website plus a small Node.js server that adds member login to the **Calculators** page.

- The main portfolio (all animations, photos and sections) is public.
- The calculators are only sent to signed-in members. The calculator code lives in `private/` and the server refuses it without a valid login.
- No outside packages: only Node.js built-ins, so there is nothing to `npm install`.

## What's in here

| Path | What it is |
|---|---|
| `server.js` | Web server, sign-up / log-in / log-out API, admin commands |
| `public/` | The website (`index.html`) and photos (`img/`) |
| `private/calculators.js` | Calculator code, served only to signed-in users |
| `Dockerfile` | Builds the container (Node 20 Alpine) |
| `docker-compose.yml` | Optional, if you prefer the Docker Compose build pack |

## Deploy in Coolify (Dockerfile build pack)

1. **Put this folder in a Git repository** (GitHub, GitLab or Gitea), with `Dockerfile` at the repository root.
2. In Coolify, create a **new resource** from that repository and choose the **Dockerfile** build pack.
3. Set the **port** to `3000`.
4. Add a **persistent storage** volume mounted at `/data`. This is where accounts are kept (`/data/users.json`). Without it, accounts are lost on every redeploy.
5. Add **environment variables**:

   | Variable | Value |
   |---|---|
   | `SESSION_SECRET` | A long random string, 32+ characters. Generate one with `openssl rand -hex 32`. **Required.** |
   | `SIGNUP` | `open` (anyone can register), `code` (needs an access code) or `closed` (invite only) |
   | `SIGNUP_CODE` | The access code, if `SIGNUP=code` |

6. Set the **domain** to `https://harising.cloud`. Coolify's proxy provides HTTPS. The login cookie is `Secure`, so the site must be served over HTTPS.
7. Optional: set the **health check** path to `/healthz`.
8. **Deploy.**

## Managing members

Open the container's terminal in Coolify and run:

```sh
node server.js users                       # list accounts
node server.js delete someone@example.com  # remove an account
node server.js reset someone@example.com NewPass123   # set a new password (logs them out everywhere)
```

To stop new sign-ups, change `SIGNUP` to `closed` (or `code`) and redeploy. Existing members can still log in.

## Security notes

- Passwords are hashed with scrypt and a unique salt per user. They are never stored in plain text.
- Sessions are signed, HttpOnly, SameSite=Lax cookies that last 30 days (change with `SESSION_DAYS`).
- Login and sign-up are rate-limited to 10 attempts per 15 minutes per IP address.
- The API only accepts JSON requests, which blocks cross-site form posts.
- Back up the `/data` volume to keep your member list.

## Run locally

```sh
COOKIE_SECURE=false SESSION_SECRET=dev-secret-at-least-32-characters-long DATA_DIR=./data node server.js
# open http://localhost:3000/#calculators
```
