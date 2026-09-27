# hop-hop-live

A TikTok-like full-stack starter app with short-video uploads, live session hooks, comments, likes/hearts, follow/unfollow, and realtime notifications.

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Multer, Socket.io
- **Frontend:** React (Vite), React Router, Socket.io client
- **Database Collections:** Users, Videos, Comments, Likes

## Project Structure

- `/backend` Express API + Socket.io server
- `/frontend` React app

## Setup

### 1) Install dependencies

```bash
npm run install:all
```

### 2) Configure environment

Backend:

```bash
cp /home/runner/work/hop-hop-live/hop-hop-live/backend/.env.example /home/runner/work/hop-hop-live/hop-hop-live/backend/.env
```

Frontend:

```bash
cp /home/runner/work/hop-hop-live/hop-hop-live/frontend/.env.example /home/runner/work/hop-hop-live/hop-hop-live/frontend/.env
```

Update values as needed.

### 3) Run backend

```bash
npm run dev:backend
```

### 4) Run frontend

```bash
npm run dev:frontend
```

Frontend default URL: `http://localhost:5173`
Backend default URL: `http://localhost:5000`

## Implemented API (initial)

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/users/:id` - Profile
- `POST /api/users/:id/follow` - Follow user
- `POST /api/users/:id/unfollow` - Unfollow user
- `POST /api/videos` - Upload video (multipart/form-data)
- `GET /api/videos/feed` - Timeline feed
- `POST /api/videos/:id/like` - Toggle like/heart
- `POST /api/videos/:id/comments` - Add comment
- `GET /api/live` - List active live sessions
- `POST /api/live/start` - Start live session
- `POST /api/live/:roomId/end` - End live session

## Realtime Events (Socket.io)

- `notification` - follow/like/comment events
- `live:started` / `live:ended`
- `live:join-room` / `live:leave-room`
- `join:user` to subscribe to user-room notifications

## Notes

- This is an initial full-stack scaffold with core features and wiring.
- Video files are stored locally under `/backend/src/uploads` for development.
