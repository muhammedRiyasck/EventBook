# 🎉 EventBook — Event Booking Platform

A full-stack event booking platform where users can search and book services like marriage venues, hotels, caterers, cameramen, DJs, and decorators. Built with **Next.js 14**, **Express.js**, **TypeScript**, and **MongoDB**.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Creating an Admin Account](#creating-an-admin-account)

---

## ✨ Features

### User Features
- **Registration & Authentication** — Sign up / log in with JWT. Passwords hashed with bcrypt.
- **Browse & Search** — Search services by keyword (full-text), category, city, price range, and date availability.
- **Pagination & Sorting** — Paginated results with sort options (newest, price, rating).
- **Service Details** — Image gallery, full description, contact info, availability calendar.
- **Book a Service** — Select dates, auto-calculated price (days × price/day), instant confirmation.
- **My Bookings** — View past and upcoming bookings with status, cancel active bookings.
- **Email Notifications** — Confirmation and cancellation emails via Nodemailer.

### Admin Features
- **Admin Dashboard** — Stats: total services, bookings, confirmed, cancelled.
- **Service Management** — Add, edit, soft-delete services with image upload (Cloudinary).
- **All Bookings** — Paginated table of all bookings, update status inline.

### Security
- JWT authentication (Bearer token + httpOnly cookie)
- bcrypt password hashing (12 salt rounds)
- Rate limiting on auth routes (10 req / 15 min)
- MongoDB injection sanitization (`express-mongo-sanitize`)
- Secure HTTP headers (`helmet`)
- Input validation (`express-validator`)
- CORS configured for frontend origin only

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind/CSS Modules |
| Backend Architecture | Layered Clean Architecture (Controller → Service → Repository → DB) |
| Runtime | Node.js (v20+ LTS), Express.js 5 |
| Database | MongoDB + Mongoose ODM (Atomic operations & index optimization) |
| Payment Gateway | Stripe API (PaymentIntents, Webhook signatures, Idempotent lifecycle) |
| Unit & Integration Testing | Vitest, Supertest, V8 Coverage |
| Containerization | Docker (Multi-stage build), Docker Compose |
| Auth & Security | JWT, bcryptjs, Helmet, Express Rate Limit, Mongo Sanitize |
| File Storage | Cloudinary API + Multer (in-memory streaming) |
| Event Architecture | Node.js EventEmitter (Decoupled async notification bus) |

---

## 🏛 Backend System Architecture

```
HTTP Requests
      │
      ▼
┌────────────────────────────────────────────────────────┐
│  Routing Layer (src/routes/)                           │
│  - Endpoint routing, HTTP method mapping               │
│  - express-validator request boundary validation       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Thin Controller Layer (src/controllers/)             │
│  - Pure HTTP adapters (status codes, headers, cookies) │
│  - No business logic, no direct DB queries (5-10 LOC)  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Domain Service Layer (src/services/)                  │
│  - Core business rules, booking state machines         │
│  - Stripe payment orchestration & webhook idempotency  │
│  - Throws typed AppError instances (400, 401, 403, 409)│
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  Repository Layer            │ │  Event Bus & External APIs   │
│  (src/repositories/)        │ │  - Node.js EventEmitter      │
│  - Encapsulates all queries  │ │  - Stripe SDK                │
│  - Atomic reservation locks  │ │  - Cloudinary Streaming      │
│  - Mongoose Document / Model │ │  - Nodemailer SMTP           │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 📁 Project Structure

```
event-booking-platform/
├── docker-compose.yml         # Multi-container orchestration (App + MongoDB)
├── client/                    # Next.js 14 frontend
│   └── src/
│       ├── app/               # App Router pages
│       ├── components/        # Reusable UI components
│       ├── context/           # AuthContext
│       └── lib/               # Axios API client
│
└── server/                    # Enterprise Express.js Backend
    ├── Dockerfile             # Multi-stage production container
    ├── vitest.config.ts       # Test runner configuration & coverage rules
    └── src/
        ├── config/            # Strongly-typed env, DB, Stripe, Cloudinary
        ├── controllers/       # Thin HTTP adapters
        ├── dto/               # Data Transfer Objects & validation types
        ├── errors/            # AppError hierarchy (Conflict, NotFound, etc.)
        ├── middleware/        # JWT auth, error handler, rate limits
        ├── models/            # Mongoose schemas & TypeScript interfaces
        ├── repositories/      # Repository pattern (all DB queries)
        ├── routes/            # Express route definitions
        ├── services/          # Pure business logic layer
        ├── utils/             # EventEmitter, price calculator, email templates
        └── __tests__/         # Automated Vitest unit & integration test suites
```

---

## 🗄 Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique, indexed)",
  "password": "string (bcrypt hashed, select: false)",
  "role": "enum: ['user', 'admin']",
  "phone": "string (optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Services Collection
```json
{
  "_id": "ObjectId",
  "title": "string",
  "category": "enum: ['venue','hotel','caterer','cameraman','dj','decorator','other']",
  "description": "string",
  "pricePerDay": "number",
  "location": { "city": "string", "state": "string", "address": "string" },
  "images": ["string (Cloudinary URLs)"],
  "availability": [{ "startDate": "Date", "endDate": "Date", "isBooked": "boolean" }],
  "contact": { "phone": "string", "email": "string", "website": "string" },
  "tags": ["string"],
  "rating": "number (0-5)",
  "isActive": "boolean",
  "createdBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
**Indexes:** `{ title: 'text', description: 'text', tags: 'text' }`, `{ category: 1 }`, `{ 'location.city': 1 }`, `{ pricePerDay: 1 }`

### Bookings Collection
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User)",
  "service": "ObjectId (ref: Service)",
  "startDate": "Date",
  "endDate": "Date",
  "totalDays": "number (calculated)",
  "totalPrice": "number (pricePerDay × totalDays)",
  "status": "enum: ['pending','confirmed','cancelled','completed']",
  "paymentStatus": "enum: ['unpaid','paid']",
  "notes": "string (optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
**Indexes:** `{ user: 1 }`, `{ service: 1 }`, `{ status: 1 }`, `{ startDate: 1, endDate: 1 }`

---

## 📡 API Documentation

**Base URL:** `http://localhost:5000/api`

### Auth Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login (user or admin) |
| GET | `/auth/me` | ✅ JWT | Get current user |

**POST /auth/register** — Body:
```json
{ "name": "John Doe", "email": "john@email.com", "password": "secret123", "phone": "9876543210" }
```
**POST /auth/login** — Body:
```json
{ "email": "john@email.com", "password": "secret123" }
```
**Response:**
```json
{ "success": true, "token": "JWT_TOKEN", "user": { "_id": "...", "name": "...", "email": "...", "role": "user" } }
```

---

### Services Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/services` | ❌ | Any | List services (paginated) |
| GET | `/services/:id` | ❌ | Any | Get service by ID |
| POST | `/services` | ✅ | Admin | Create service (multipart/form-data) |
| PUT | `/services/:id` | ✅ | Admin | Update service |
| DELETE | `/services/:id` | ✅ | Admin | Soft-delete service |

**GET /services — Query Parameters:**
```
?page=1          # Page number (default: 1)
&limit=12        # Items per page (max: 50)
&sort=newest     # newest | pricePerDay_asc | pricePerDay_desc | rating_desc
&category=venue  # venue | hotel | caterer | cameraman | dj | decorator | other
&city=Mumbai     # City name (case-insensitive)
&minPrice=1000   # Minimum price per day
&maxPrice=50000  # Maximum price per day
&startDate=2025-01-15  # Availability filter start
&endDate=2025-01-20    # Availability filter end
&search=luxury+wedding # Full-text search
```

**POST /services — multipart/form-data:**
```
title         = "Royal Garden Venue"
category      = "venue"
description   = "A beautiful outdoor venue..."
pricePerDay   = 25000
location      = {"city":"Mumbai","state":"Maharashtra","address":"123 Marine Drive"}
contact       = {"phone":"9876543210","email":"contact@venue.com"}
tags          = ["luxury","outdoor","garden"]
images        = [File, File, ...]   # max 5, each max 5MB
```

---

### Bookings Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/bookings` | ✅ | User | Create booking |
| GET | `/bookings/my` | ✅ | User | Get my bookings |
| GET | `/bookings/:id` | ✅ | Owner/Admin | Get booking by ID |
| PATCH | `/bookings/:id/cancel` | ✅ | Owner | Cancel booking |
| GET | `/bookings` | ✅ | Admin | Get all bookings |
| PATCH | `/bookings/:id/status` | ✅ | Admin | Update booking status |

**POST /bookings** — Body:
```json
{
  "serviceId": "6507a1b2c3d4e5f6a7b8c9d0",
  "startDate": "2025-01-15",
  "endDate": "2025-01-20",
  "notes": "Need vegetarian catering"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "startDate": "2025-01-15",
    "endDate": "2025-01-20",
    "totalDays": 5,
    "totalPrice": 125000,
    "status": "confirmed"
  },
  "message": "Booking confirmed! A confirmation email has been sent."
}
```

**GET /bookings/my — Query Parameters:**
```
?type=upcoming   # upcoming | past (optional, default: all)
?status=confirmed  # filter by status (optional)
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+ 
- MongoDB (running locally on port 27017)
- Cloudinary account (free tier works)
- Gmail account with App Password enabled

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd event-booking-platform
```

### 2. Set up the Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
```

### 3. Set up the Frontend
```bash
cd client
npm install
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

---

## 🔧 Environment Variables

### `server/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/event-booking
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Cloudinary (https://cloudinary.com — free account)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gmail (enable App Password at myaccount.google.com/security)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_16_chars

CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### `client/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Running the Project

### Start MongoDB
```bash
# Windows (if installed as service)
net start MongoDB

# Or start mongod manually
mongod --dbpath C:\data\db
```

### Start the Backend
```bash
cd server
npm run dev
# Server starts at http://localhost:5000
```

### Start the Frontend
```bash
cd client
npm run dev
# App opens at http://localhost:3000
```

---

## 👤 Creating an Admin Account

The admin role must be set manually in MongoDB. Here's how:

### Step 1 — Register a normal account via API or UI

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@eventbook.com","password":"admin123"}'
```

### Step 2 — Update the role in MongoDB

Open MongoDB Compass or run in mongosh:
```js
use event-booking

db.users.updateOne(
  { email: "admin@eventbook.com" },
  { $set: { role: "admin" } }
)
```

### Step 3 — Log in as admin

Visit `http://localhost:3000/login` and sign in. You'll be automatically redirected to `/admin/dashboard`.

---

## 🏗 Build for Production

```bash
# Build backend
cd server && npm run build

# Build frontend
cd client && npm run build
```

---

## 🧪 Automated Testing

EventBook features comprehensive automated test suites using **Vitest** and **Supertest** covering domain services, state machines, and API integration:

```bash
cd server

# Run all test suites
npm test

# Run with test coverage report
npm run test:coverage
```

---

## 🐳 Running with Docker

Run the entire backend stack and MongoDB with a single command:

```bash
# Build and run containers in background
docker compose up -d

# Check service health
curl http://localhost:5000/api/health

# View live logs
docker compose logs -f server

# Stop containers
docker compose down
```

---

## 💼 Resume & Interview Talking Points

- **Layered Clean Architecture**: Decoupled HTTP transport (Controllers), domain business logic (Services), and database queries (Repositories) to achieve high testability and maintainability.
- **Race Condition Prevention**: Solved the classic booking double-booking concurrency problem using atomic conditional updates (`atomicReserveDates`) with automatic rollback mechanics.
- **Idempotent Payment Processing**: Engineered Stripe webhook handling with signature verification, idempotent lifecycle transitions, and automatic refund calculations based on tiered cancellation policies (`Flexible`, `Moderate`).
- **Domain Event-Driven Architecture**: Decoupled non-blocking side-effects (confirmation emails, OTP generation, admin alerts) into an asynchronous event bus using Node.js `EventEmitter`.
- **Operational Error Hierarchy**: Built a centralized `AppError` inheritance tree distinguishing operational client errors from fatal system errors, ensuring clean JSON responses without leaking server stack traces in production.
- **Strict TypeScript & Automated Testing**: Fully typed codebase with zero compilation errors, combined with unit and integration test suites using Vitest and Supertest.

---

## 📖 Interactive API Documentation (Swagger / OpenAPI)

EventBook includes a complete, interactive **Swagger UI** for testing and exploring endpoints directly in the browser:

- **Swagger UI**: [`http://localhost:5000/api/docs`](http://localhost:5000/api/docs)
- **OpenAPI 3.0 Raw JSON**: [`http://localhost:5000/api/docs.json`](http://localhost:5000/api/docs.json) (importable into Postman or Insomnia)

Features:
- Full request/response schemas for Auth, Services, Bookings, and Payments.
- Interactive **"Try it out"** button with persistent JWT Bearer token authentication.

---

## 📌 Health Check

```
GET http://localhost:5000/api/health
→ { "success": true, "message": "EventBook API is running", "timestamp": "..." }
```
