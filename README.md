# Symposium Event System

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start MongoDB locally.
   - The app expects MongoDB at `mongodb://127.0.0.1:27017` by default.
   - Use your local MongoDB service or Docker container.

3. Start the application:
   ```bash
   npm start
   ```

4. Open the app in your browser:
   - `http://localhost:3000`

## Default Admin

- Username: `Ragul`
- Password: `Ragul3512`

## Environment Variables

The app loads configuration from `.env`:

```text
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/symposium_event_system
SESSION_SECRET=SymposiumSecret2026
```
