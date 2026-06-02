# TODO - Convert TypeRacer to Static Frontend + MySQL Backend (UI/UX + Features preserved)

## Step 1: Backend (MySQL)
- [ ] Create `backend-mysql/` folder structure
- [x] Implement Express server with identical routes under `/api/*`

- [x] Add JWT auth guard (same request/response shapes)

- [ ] Add MySQL connection layer
- [ ] Add WebSocket server at `/ws` with same message protocol (`START`, `TICK`, `WPM_UPDATE`)
- [x] Create MySQL DDL in `backend-mysql/sql/001_init.sql` (users, games, results)


## Step 2: Frontend (HTML/CSS/JS)
- [ ] Create `frontend/` folder structure
- [ ] Create static `index.html`, base styling (`assets/styles.css`) using copied theme variables
- [ ] Implement SPA router supporting routes: `/`, `/auth`, `/game`, `/leaderboard`, `/history`, `/admin`, `/results/:id`, `*`
- [ ] Implement Navbar (same logic as React)
- [ ] Implement Pages:
  - [ ] Home
  - [ ] Auth (login/register toggle)
  - [ ] Game (typing, timer, cursor/error highlighting, websocket updates, submit result + redirect)
  - [ ] Leaderboard (difficulty tabs)
  - [ ] History
  - [ ] Results (personal best detection)
  - [ ] Admin (role check + CRUD + modal)
- [ ] Implement API client helpers + token storage

## Step 3: Integration / Run
- [ ] Add start script / run instructions for backend
- [ ] Add instructions to apply MySQL DDL
- [ ] Add instructions to serve frontend
- [ ] Manual end-to-end verification checklist

