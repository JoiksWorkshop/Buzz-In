# Getting Buzz·In online so your friends can join (free)

Real-time buzzing needs a small always-on server, so this can't be a plain static
file — you'll host the Node app. The free path below uses **GitHub + Render.com**.
Total time: ~15 minutes. No credit card required for Render's free web service.

---

## Step 1 — Put the code on GitHub
1. Make a free account at https://github.com if you don't have one.
2. Click the **+** (top right) → **New repository**.
3. Name it `buzz-in`, leave it **Public**, click **Create repository**.
4. Easiest upload method (no command line):
   - On the new repo page click **uploading an existing file**.
   - Drag in `server.js`, `package.json`, `README.md`, `DEPLOY.md`, `.gitignore`,
     and the **`public`** folder (with `index.html` inside it).
   - **Do NOT upload `node_modules`** — Render builds that itself.
   - Click **Commit changes**.

## Step 2 — Create the Render web service
1. Make a free account at https://render.com (sign in with GitHub — simplest).
2. Dashboard → **New +** → **Web Service**.
3. Connect your GitHub and pick the **buzz-in** repo.
4. Fill in:
   - **Name:** `buzz-in` (this becomes part of your URL)
   - **Region:** closest to you
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** **Free**
5. Click **Create Web Service**. Render installs and boots it (~1–2 min). When it
   says **Live**, you'll have a URL like `https://buzz-in.onrender.com`.

## Step 3 — Play
- Share that URL with your friends.
- One person clicks **Create a lobby**, sets a password + max players, and becomes host.
- Everyone else enters their name + the 4-letter code on the main menu and hits **Join**.
- The host reads questions from your board (shared however you like), opens the
  buzzers, and uses the +/− buttons to score.

---

## Good to know
- **Free tier sleeps.** After ~15 min idle, the free Render service spins down and
  the next visit takes ~30–50 seconds to wake. Open the URL a minute before game
  night to warm it up. (Upgrading to Render's cheapest paid tier removes this.)
- **Lobbies live in memory.** If the server restarts, active lobbies clear. That's
  fine for a game night — just make a new lobby.
- **Updating the app later:** edit the file on GitHub (or re-upload), and Render
  auto-redeploys within a minute.

## Alternative hosts (same files, same start command)
Any host that runs a Node web service works: Railway, Fly.io, Glitch, or a small
VPS. Render is recommended for the simplest free setup.
