# Buzz·In — Live Jeopardy Buzzer

A real-time, multiplayer Jeopardy-style buzzer. Create a password-protected lobby,
share the 4-letter code, and everyone races to buzz in. The host gets a control
panel to manage scores, lock buzzers, set question values, kick players, and cap
the lobby size (up to 8 players). Dark mode, blue + gold.

## What's here
- `server.js` — Node + Express + Socket.io backend (lobbies, buzzing, scoring)
- `public/index.html` — the entire front end (4 screens, one file)
- `package.json` — dependencies + start script

## Run it on your own computer (to test)
1. Install Node.js 18+ from https://nodejs.org
2. Open a terminal in this folder and run:
   ```
   npm install
   npm start
   ```
3. Open http://localhost:3000 in your browser. Open a second tab to play as another person.

## Put it online so friends can join (free)
See the full step-by-step in `DEPLOY.md`. Short version: push this folder to a
GitHub repo, create a free Render.com Web Service pointed at it, and share the URL.
