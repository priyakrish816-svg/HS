# harising.cloud: deploy on Coolify

This repository is the complete website plus a small Node.js server that protects the **Calculators** page with an admin login.

- The main portfolio (all animations, photos and sections) is public.
- The calculators are only sent to a signed-in account. The calculator code lives in `private/`, and the server refuses it without a valid login.
- **Sign-up is switched off.** The only account is the admin, **ozharising@gmail.com**, created automatically the first time the server starts.
- **Forgot password?** on the login page emails a one-time reset link. It's also how you set the admin password for the first time.
- No outside packages: only Node.js built-ins, so there is nothing to `npm install`.

## Important: Coolify must use the Dockerfile

The login only works when Coolify runs `server.js`. If the app uses the **Static** build pack, the site still loads but the Calculators page shows "The calculators could not load".

## Deploy in Coolify

1. Create the resource from this GitHub repository and choose the **Dockerfile** build pack (not Static or Nixpacks).
2. Set the exposed **port** to `3000`.
3. Add a **persistent storage** volume mounted at `/data`. Accounts live in `/data/users.json`. Without the volume, the admin password is lost on every redeploy.
4. Add these **environment variables**:

   | Variable | Value |
   |---|---|
   | `SESSION_SECRET` | A long random string, 32+ characters. Generate with `openssl rand -hex 32`. **Required.** |
   | `PUBLIC_URL` | `https://harising.cloud` |
   | `SMTP_USER` | `ozharising@gmail.com` |
   | `SMTP_PASS` | A **Gmail App Password** (see below), not your normal Gmail password |

   | `ADMIN_PASSWORD_HASH` | Your admin password in protected (hashed) form, so it survives every redeploy. Create it with `node server.js hash 'YourPassword'` and paste the whole line it prints. |

   Optional: `ADMIN_EMAIL` (default `ozharising@gmail.com`), `SIGNUP` (default `closed`), `SMTP_HOST` (default `smtp.gmail.com`), `SMTP_PORT` (default `465`), `MAIL_FROM` (default `SMTP_USER`).

5. Set the **domain** to `https://harising.cloud`. The login cookie is `Secure`, so the site must use HTTPS.
6. Optional: health check path `/healthz`.
7. **Deploy.**

## Gmail App Password (for reset emails)

1. Turn on 2-Step Verification on the Google account ozharising@gmail.com.
2. Go to Google Account → Security → **App passwords**, create one called "harising.cloud", and copy the 16-character password.
3. Paste it into Coolify as `SMTP_PASS` and redeploy.

## Keep your password across redeploys

Set `ADMIN_PASSWORD_HASH` in Coolify (see the table above). The server applies it every time it starts, so pushing from GitHub never resets your password, even if the `/data` volume is missing. To change the password later, create a new value with `node server.js hash 'NewPassword'`, replace the setting and redeploy.

Also set `SESSION_SECRET` to a fixed value. If it's missing, the server makes a random one on each start and you're logged out after every deploy.

## Set the admin password the first time (without ADMIN_PASSWORD_HASH)

1. Open https://harising.cloud/#calculators and click **Forgot password?**
2. Enter **ozharising@gmail.com**. A reset link arrives by email (check spam). It works once and expires after 60 minutes.
3. Choose your password. You're signed in straight away.

**No email set up yet?** Open the container terminal in Coolify and run:

```sh
node server.js reset-link ozharising@gmail.com
```

It prints a one-time link to open in your browser. If email sending fails, the server also writes the link to the Coolify logs.

## Admin commands (Coolify terminal)

```sh
node server.js users                          # list accounts
node server.js reset-link <email>             # print a one-time password link
node server.js add <email> [name]             # add another account (prints a link to set its password)
node server.js delete <email>                 # remove an account
node server.js reset <email> <new-password>   # set a password directly
node server.js hash '<password>'              # make a value for ADMIN_PASSWORD_HASH
```

## Security notes

- Passwords are hashed with scrypt and a unique salt. They are never stored in plain text.
- Reset links are random, single-use, expire after 60 minutes, and are stored only as a hash. Setting a new password logs out every other session.
- "Forgot password" gives the same answer whether or not an email has an account, so nobody can probe for accounts.
- Sessions are signed, HttpOnly, SameSite=Lax cookies that last 30 days (change with `SESSION_DAYS`).
- Login, reset and sign-up attempts are rate-limited to 10 per 15 minutes per IP address.
- Back up the `/data` volume.

## Run locally

```sh
COOKIE_SECURE=false SESSION_SECRET=dev-secret-at-least-32-characters-long DATA_DIR=./data node server.js
# then: node server.js reset-link ozharising@gmail.com   (with the same DATA_DIR) and open the link, swapping in http://localhost:3000
```
