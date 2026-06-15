# FlowDesk

A full-stack task management platform built with **.NET 8 (Clean Architecture)** and **React + TypeScript**, featuring JWT authentication, a Kanban-style workflow, and a fully Dockerized PostgreSQL setup.

![FlowDesk Dashboard](docs/screenshots/dashboard.png)

## Why FlowDesk?

Most task manager projects stop at basic CRUD. FlowDesk goes further — it's built the way a real product team would structure it:

- **Clean Architecture** on the backend — Core, Infrastructure, and API layers are fully decoupled
- **JWT-based authentication** — every user only sees their own tasks
- **4-stage Kanban workflow** — Todo → In Progress → In Review → Done
- **Dockerized PostgreSQL** — clone and run with one command, no manual DB setup
- **Type-safe React frontend** — Formik + Yup for forms, Axios with JWT interceptors

## Tech Stack

**Backend**
- .NET 8 Web API (Clean Architecture: Core / Infrastructure / API)
- Entity Framework Core + PostgreSQL
- JWT Bearer Authentication
- BCrypt password hashing
- Swagger / OpenAPI

**Frontend**
- React 18 + TypeScript (Vite)
- Tailwind CSS v4
- Formik + Yup (form validation)
- Axios with request/response interceptors
- React Router

**Infrastructure**
- Docker & Docker Compose (PostgreSQL)
- EF Core Migrations

## Architecture
FlowDesk/

├── backend/

│   ├── FlowDesk.API/             # Controllers, Program.cs, JWT config

│   ├── FlowDesk.Core/            # Entities, DTOs, interfaces (no dependencies)

│   ├── FlowDesk.Infrastructure/  # EF Core, repositories, services

│   └── FlowDesk.Tests/           # Unit tests

├── frontend/

│   └── src/

│       ├── api/                  # Axios instance + service layer

│       ├── context/              # Auth context (global state)

│       ├── components/           # TaskCard, TaskForm, ProtectedRoute

│       └── pages/                # Login, Register, Dashboard

└── docker-compose.yml

The backend follows **Clean Architecture**: `Core` has zero external dependencies and defines contracts (`ITaskRepository`, `IAuthService`). `Infrastructure` implements those contracts using EF Core. `API` wires everything together. This means the data layer (PostgreSQL) could be swapped without touching business logic.

## Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- Docker Desktop

### 1. Clone and start the database
```bash
git clone https://github.com/<your-username>/flowdesk.git
cd flowdesk
docker compose up -d
```

### 2. Configure secrets
```bash
cd backend/FlowDesk.API
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "your-secret-key-here"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5433;Database=FlowDeskDB;Username=postgres;Password=postgres"
```

### 3. Run database migrations
```bash
dotnet ef database update --project ../FlowDesk.Infrastructure --startup-project .
```

### 4. Start the backend
```bash
dotnet run
```
API runs at `https://localhost:7219` — Swagger UI at `/swagger`

### 5. Start the frontend
```bash
cd ../../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

## Features

- ✅ User registration & login with JWT
- ✅ User-scoped task data (each user sees only their own tasks)
- ✅ Full CRUD for tasks (title, description, priority, due date, status)
- ✅ Kanban board with 4-stage workflow
- ✅ Form validation with Formik + Yup
- ✅ Protected routes (frontend) + `[Authorize]` endpoints (backend)
- ✅ Dockerized PostgreSQL with persistent volumes

## Roadmap

- [ ] Real-time updates via SignalR
- [ ] AI-powered task suggestions (natural language → task)
- [ ] Multi-tenant support with Redis caching
- [ ] CI/CD pipeline with GitHub Actions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/Auth/register` | Register a new user |
| POST | `/api/Auth/login` | Login, returns JWT |
| GET | `/api/Tasks` | Get all tasks for current user |
| GET | `/api/Tasks/{id}` | Get a single task |
| POST | `/api/Tasks` | Create a new task |
| PUT | `/api/Tasks/{id}` | Update a task |
| DELETE | `/api/Tasks/{id}` | Delete a task |

