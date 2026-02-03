# Smart Workspace

A workspace management system for booking rooms and resources.

## Project Structure

```
smart-workspace/
├─ backend/
│ ├─ src/
│ │ ├─ index.js
│ │ ├─ routes.js
│ │ ├─ swagger.yaml
│ │ ├─ controllers/
│ │ │ ├─ approvalController.js
│ │ │ ├─ authController.js
│ │ │ ├─ bookingController.js
│ │ │ ├─ cancelController.js
│ │ │ ├─ resourceController.js
│ │ │ ├─ searchController.js
│ │ ├─ cron/
│ │ │ └─ jobs.js
│ │ ├─ middleware/
│ │ │ ├─ auth.js
│ │ │ ├─ rateLimiter.js
│ │ │ ├─ requireAdmin.js
│ │ │ └─ validate.js
│ │ ├─ models/
│ │ │ ├─ index.js
│ │ │ ├─ user.js
│ │ │ ├─ department.js
│ │ │ ├─ room.js
│ │ │ ├─ resource.js
│ │ │ ├─ booking.js
│ │ │ ├─ bookingResource.js
│ │ │ └─ departmentCredit.js
│ │ ├─ public/
│ │ │ └─ 429.html
│ │ ├─ routes/
│ │ │ ├─ admin.routes.js
│ │ │ ├─ auth.routes.js
│ │ │ ├─ booking.routes.js
│ │ │ ├─ credit.routes.js
│ │ │ ├─ resource.routes.js
│ │ │ ├─ search.routes.js
│ │ ├─ services/
│ │ │ ├─ creditService.js
│ │ │ ├─ emailService.js
│ │ │ └─ icsGenerator.js
│ │ ├─ validators/
│ │ │ ├─ auth.schema.js
│ │ │ ├─ booking.schema.js
│ │ │ ├─ resource.schema.js
│ │ │ └─ room.schema.js
│ ├─ tmp/ # ICS files saved here (auto-created)
│ ├─ .env
│ ├─ .gitignore
│ ├─ .dockerignore
│ ├─ Dockerfile
│ └─ package.json
├─ frontend/
│ ├─ src/
│ │ ├─ main.jsx
│ │ ├─ App.jsx
│ │ ├─ App.css
│ │ ├─ index.css
│ │ ├─ AuthContext.jsx
│ │ ├─ ProtectedRoute.jsx
│ │ ├─ Navbar.jsx
│ │ ├─ Login.jsx
│ │ ├─ Register.jsx
│ │ ├─ Dashboard.jsx
│ │ ├─ MainLayout.jsx
│ │ ├─ AdminLayout.jsx
│ │ ├─ BookRoom.jsx
│ │ ├─ BookingForm.jsx
│ │ ├─ BookingList.jsx
│ │ ├─ BookingListHomePage.jsx
│ │ ├─ SearchRooms.jsx
│ │ ├─ AddRoom.jsx
│ │ ├─ RoomManagement.jsx
│ │ ├─ AddResource.jsx
│ │ ├─ ResourceManagement.jsx
│ │ ├─ Approvals.jsx
│ │ ├─ AdminRequests.jsx
│ │ ├─ UserManagement.jsx
│ │ ├─ DepartmentBookingList.jsx
│ │ └─ assets/
│ ├─ public/
│ │ └─ 429.html
│ ├─ .gitignore
│ ├─ .dockerignore
│ ├─ Dockerfile
│ ├─ eslint.config.js
│ ├─ vite.config.js
│ ├─ index.html
│ ├─ package.json
│ └─ README.md
└─ README.md
```

## Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## Configuration

Create a `.env` file based on `.env` with your configuration.

## Usage

```
# Backend
cd backend
npm run start  (or `npm run dev` with nodemon)

# Frontend
cd frontend
npm run dev
```
