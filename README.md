# Smart Workspace

A workspace management system for booking rooms and resources.

## Project Structure

```text
smart-workspace/
|-- backend/
|   |-- src/
|   |   |-- index.js
|   |   |-- routes.js
|   |   |-- swagger.yaml
|   |   |-- controllers/
|   |   |   |-- approvalController.js
|   |   |   |-- authController.js
|   |   |   |-- bookingController.js
|   |   |   |-- creditController.js
|   |   |   |-- resourceController.js
|   |   |   `-- searchController.js
|   |   |-- cron/
|   |   |   `-- jobs.js
|   |   |-- middleware/
|   |   |   |-- auth.js
|   |   |   |-- rateLimiter.js
|   |   |   |-- requireAdmin.js
|   |   |   `-- validate.js
|   |   |-- models/
|   |   |   |-- index.js
|   |   |   |-- user.js
|   |   |   |-- department.js
|   |   |   |-- departmentCredit.js
|   |   |   |-- room.js
|   |   |   |-- roomResourceInventory.js
|   |   |   |-- resource.js
|   |   |   |-- booking.js
|   |   |   |-- booking_resources.js
|   |   |   `-- passwordResetToken.js
|   |   |-- public/
|   |   |   `-- 429.html
|   |   |-- queues/
|   |   |   `-- emailQueue.js
|   |   |-- routes/
|   |   |   |-- admin.routes.js
|   |   |   |-- auth.routes.js
|   |   |   |-- booking.routes.js
|   |   |   |-- credit.routes.js
|   |   |   |-- resource.routes.js
|   |   |   `-- search.routes.js
|   |   |-- services/
|   |   |   |-- creditService.js
|   |   |   |-- emailService.js
|   |   |   |-- icsGenerator.js
|   |   |   `-- resourceReturnService.js
|   |   |-- validators/
|   |   |   |-- auth.schema.js
|   |   |   |-- booking.schema.js
|   |   |   |-- resource.schema.js
|   |   |   |-- room.schema.js
|   |   |   `-- searchRoom.schema.js
|   |-- tmp/                # ICS files (auto-created)
|   |-- Dockerfile
|   |-- package.json
|   `-- package-lock.json
|-- frontend/
|   |-- src/
|   |   |-- main.jsx
|   |   |-- App.jsx
|   |   |-- App.css
|   |   |-- index.css
|   |   |-- AuthContext.jsx
|   |   |-- ProtectedRoute.jsx
|   |   |-- Navbar.jsx
|   |   |-- Login.jsx
|   |   |-- Register.jsx
|   |   |-- ForgotPassword.jsx
|   |   |-- ResetPassword.jsx
|   |   |-- ChangePassword.jsx
|   |   |-- Dashboard.jsx
|   |   |-- MainLayout.jsx
|   |   |-- AdminLayout.jsx
|   |   |-- BookRoom.jsx
|   |   |-- BookingForm.jsx
|   |   |-- BookingList.jsx
|   |   |-- BookingListHomePage.jsx
|   |   |-- SearchRooms.jsx
|   |   |-- AddRoom.jsx
|   |   |-- RoomManagement.jsx
|   |   |-- AddResource.jsx
|   |   |-- ResourceManagement.jsx
|   |   |-- Approvals.jsx
|   |   |-- AdminRequests.jsx
|   |   |-- UserManagement.jsx
|   |   |-- DepartmentBookingList.jsx
|   |   `-- assets/
|   |-- public/
|   |   |-- 429.html
|   |   |-- workspace.svg
|   |   `-- workspace-icon.svg
|   |-- Dockerfile
|   |-- eslint.config.js
|   |-- vite.config.js
|   |-- index.html
|   |-- package.json
|   `-- package-lock.json
|-- docker-compose.yml
|-- doc.js
`-- README.md
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

Create a `.env` file in `backend/` with your local configuration values.

## Usage

```bash
# Backend
cd backend
npm run start
# or
npm run dev

# Frontend
cd frontend
npm run dev
```
