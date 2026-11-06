# Sweety — Blood Glucose Tracker

Sweety is a responsive glucose tracking app with a React/Vite frontend, an Express API, and PostgreSQL storage. Each account can manage only its own readings and reports.

## Requirements

- Node.js 18 or newer
- PostgreSQL 14 or newer

## Configure PostgreSQL

Create a database (the default configuration uses `sweety`):

```sql
CREATE DATABASE sweety;
```

The API creates the `users` and `readings` tables and indexes on startup. It requires a database role with permission to create tables and indexes the first time it runs.

## Start the application

1. Configure the backend:

   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```

   Update `DATABASE_URL` with your PostgreSQL username/password and set `JWT_SECRET` to a long, random secret. Keep `.env` private and do not commit it.

2. Install dependencies and start the API:

   ```powershell
   npm install
   npm run dev
   ```

   The API runs at `http://localhost:5000`; its health check is `http://localhost:5000/api/health`.

3. In a second terminal, configure and start the frontend:

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`.

For production frontend builds, run `npm run build` in `frontend`. Configure `VITE_API_URL` to the deployed API base URL and set `CLIENT_ORIGIN` to the frontend origin on the backend.

## API

- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — authenticate
- `GET /api/readings` — list the signed-in user’s readings
- `POST /api/readings` — add a reading
- `PUT /api/readings/:id` — update an owned reading
- `DELETE /api/readings/:id` — delete an owned reading
- `GET /api/reports/daily?date=YYYY-MM-DD`
- `GET /api/reports/month-to-date?date=YYYY-MM-DD`
- `GET /api/reports/monthly?date=YYYY-MM-DD` — full calendar month preceding the selected date’s month

Reading requests use `{ "date": "YYYY-MM-DD", "timeSlot": "morning_fasting", "value": 105 }`. Allowed time slots are `morning_fasting`, `after_breakfast`, `after_lunch`, and `after_dinner`. Values must be whole numbers from 40 to 600 mg/dL. Dates are interpreted as UTC calendar dates and cannot be in the future. A unique database constraint enforces one reading per user, date, and time slot; the four allowed slots cap readings at four per day.

## Tests

Backend API tests use an in-memory PostgreSQL-compatible database and do not require a running PostgreSQL server:

```powershell
cd backend
npm test
```

## Privacy and clinical note

Passwords are hashed with bcrypt; API tokens are signed JWTs. Reading and report queries are scoped to the authenticated user. Sweety is a record-keeping tool and does not provide medical advice or diagnosis.
