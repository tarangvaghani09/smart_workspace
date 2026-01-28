# Smart Workspace

A workspace management system for booking rooms and resources.

## Project Structure

```
smart-workspace/
├─ backend/
│ ├─ src/
│ │ ├─ index.js
│ │ ├─ redis.js
│ │ ├─ routes.js
│ │ ├─ swagger.yaml
│ │ ├─ controllers/
│ │ │ ├─ approvalController.js
│ │ │ ├─ authController.js
│ │ │ ├─ bookingController.js
│ │ │ ├─ cancelController.js
│ │ │ ├─ resourceController.js
│ │ │ ├─ searchController.js
│ │ │ └─ seedController.js
│ │ ├─ cron/
│ │ │ └─ jobs.js
│ │ ├─ docs/
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
│ │ │ ├─ roomApprovalRule.js
│ │ │ ├─ resource.js
│ │ │ ├─ booking.js
│ │ │ ├─ bookingResource.js
│ │ │ └─ departmentCredit.js
│ │ ├─ public/
│ │ │ └─ 429.html
│ │ ├─ queues/
│ │ ├─ routes/
│ │ ├─ services/
│ │ │ ├─ creditService.js
│ │ │ ├─ emailService.js
│ │ │ └─ icsGenerator.js
│ │ ├─ validators/
│ │ │ ├─ auth.schema.js
│ │ │ ├─ booking.schema.js
│ │ │ ├─ resource.schema.js
│ │ │ └─ room.schema.js
│ │ └─ workers/
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

 <!-- openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -->

 <!-- git remote add origin https://github.com/tarangvaghani09/workspace.git -->


<!-- for(let i=0;i<100;i++){
  fetch("https://localhost/api/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email:"alice@example.com",password:"123456"
    })
  })
  .then(r=>console.log(r.status,r.headers.get("X-Rate-Limit")));
} -->

<!-- for(let i=0;i<100;i++){
  fetch("https://localhost/api/approvals/pending",{
    method:"GET",
    headers:{"Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiZGVwYXJ0bWVudElkIjoxLCJpYXQiOjE3Njk0OTAwNTAsImV4cCI6MTc2OTU3NjQ1MH0.Y4my2sgS0G3MW0F3dfXg4SMkoE9-TVxfovIk5B3ykVk`,"Content-Type":"application/json"
    }
  })
  .then(r=>console.log(r.status,r.headers.get("X-Rate-Limit")));
} -->

<!-- for(let i=0;i<100;i++){
  fetch("/api/departments")
  .then(r=>{console.log(r.status,r.headers.get("X-Rate-Limit-By"))
  })
} -->

<!-- for(let i=0;i<100;i++){
  fetch("/api/departments")
  .then(r=>console.log(r.status))
<<<<<<< HEAD
} -->
=======
} -->
>>>>>>> 47a530d (remov admin fro controler)
