# Booking System

Professional full-stack booking platform with secure authentication, conflict-aware scheduling, and confirmation email workflow.

Built and maintained by Patricia Gea.

## Live Deployment

- Frontend: https://patriciagea.github.io/BookingSystem/

## Project Quality Highlights

- Production-ready authentication with JWT and Google OAuth.
- Booking validation that prevents duplicate time-slot conflicts.
- Service-duration validation to block bookings that exceed working hours.
- Confirmation email workflow after successful booking creation.
- Responsive, high-contrast UI with consistent design language.
- Environment-driven configuration for local and cloud deployment.

## Core Features

### Authentication and Security

- User registration with password hashing via bcrypt.
- Email/password login flow with JWT issuance.
- Google sign-in integration with Passport Google OAuth 2.0.
- Protected booking endpoints through JWT middleware.

### Booking Management

- Create booking with service size, date, and time.
- Automatic conflict detection on the same date/time slot.
- Booking duration guardrail based on selected service.
- Personal booking list for each authenticated user.
- Booking cancellation support.

### Communication

- Confirmation email sent when a booking is created.
- Non-blocking email strategy: booking remains valid even if mail delivery fails.

## Technology Stack

### Frontend

- React 19
- Vite 7
- Axios
- CSS

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- Passport + passport-google-oauth20
- bcrypt
- Nodemailer

### Deployment and Infrastructure

- GitHub Pages (frontend)
- Render (backend)
- MongoDB Atlas (database)
- GitHub Actions (CI/CD for Pages)

## Architecture Overview

```text
Client (GitHub Pages)
  -> REST API (Render / Express)
      -> MongoDB Atlas
      -> Google OAuth
      -> Gmail SMTP (Nodemailer)
```

## API Overview

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/google`
- `GET /auth/google/callback`

### Bookings (JWT required)

- `POST /bookings`
- `GET /bookings`
- `GET /bookings/my`
- `DELETE /bookings/:id`

### Health

- `GET /health`

## Local Setup

### Requirements

- Node.js 18+
- npm
- MongoDB Atlas URI (or local MongoDB)

### Install

```bash
npm install
cd api_users
npm install
```

### Environment Variables (Backend)

Create `api_users/.env` with at least:

```env
PORT=3300
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGINS=http://localhost:5180,https://patriciagea.github.io

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3300/auth/google/callback
FRONTEND_URL=http://localhost:5180

EMAIL_USER=your_gmail
EMAIL_PASS=your_gmail_app_password
```

### Run

```bash
# Backend
cd api_users
npm start

# Frontend (new terminal, project root)
npm run dev -- --host 127.0.0.1 --port 5180
```

## Production Notes

- Keep all backend secrets in Render environment variables.
- Keep frontend environment minimal (`VITE_API_URL` only).
- Configure Google OAuth redirect/origin values exactly as deployed URLs:
  - Authorized JavaScript origins: `https://patriciagea.github.io`
  - Authorized redirect URI: `https://booking-system-api-xb41.onrender.com/auth/google/callback`
  - Render `FRONTEND_URL`: `https://patriciagea.github.io/BookingSystem/`
- Use Gmail App Password (not Gmail account password) for email delivery.
- On Render, set these environment variables for confirmation emails:
  - `EMAIL_USER`: your full Gmail address (example: `you@gmail.com`)
  - `EMAIL_PASS`: Gmail App Password with spaces removed
  - Create the app password at https://myaccount.google.com/apppasswords (Google account must have 2-Step Verification enabled)
- After updating env vars on Render, trigger a manual redeploy.
- Check `https://booking-system-api-xb41.onrender.com/health` — it should return `"emailConfigured": true` after deploy.

## Author

Patricia Gea

## Contact

- GitHub: https://github.com/PatriciaGea
- LinkedIn: https://www.linkedin.com/in/patriciageadev
- Email: patricia.rodrigues@hyperisland.se
- Live Project: https://patriciagea.github.io/BookingSystem/
