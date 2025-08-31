# React Native Chat Frontend (Expo)

This is a minimal Expo React Native frontend for a 1:1 real-time chat app.
It connects to a Node.js + Socket.IO backend and implements:
- JWT auth (login/register)
- Users list with online presence
- 1:1 chat with real-time messages (Socket.IO)
- Typing indicator (typing:start|stop)
- Read receipts (✓✓)
- Message history via REST

## Quick start

1) Install dependencies
```bash
npm install -g expo-cli
cd mobile
npm install
```

2) Set backend URL  
Edit `src/env.ts` to point to your server:
```ts
export const BASE_URL = 'http://10.0.2.2:4000'; // Android emulator -> your server
```

3) Run
```bash
npm run start
```

### Expected backend endpoints
- `POST /auth/register` { name, email, password }
- `POST /auth/login` { email, password } -> { token }
- `GET /me` -> current user object
- `GET /users` -> [{ user, lastMessage? }]
- `GET /conversations/:id/messages` -> message array

### Socket events used
- `message:send` { to, text }
- `message:new` -> broadcast of new message
- `typing` { to, action: 'start' | 'stop' }
- `message:read` { peerId, messageIds }
- `presence` { onlineIds } + `presence:get`

> If your backend uses slightly different event names, adjust them in `src/screens/ChatScreen.tsx` and `src/screens/HomeScreen.tsx`.

## Notes
- Uses `expo-secure-store` to persist JWT.
- For Android emulator, `10.0.2.2` reaches your dev machine. For iOS simulator use `http://localhost:4000`.
