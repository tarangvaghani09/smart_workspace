# Smart Workspace

A workspace management system for booking rooms and resources.

## Project Structure

```
smart-workspace/
├─ package.json
├─ .env.example
├─ tmp/                   # ICS files saved here (auto-created)
├─ src/
│  ├─ index.js
│  ├─ models/
│  │  ├─ index.js
│  │  ├─ user.js
│  │  ├─ department.js
│  │  ├─ room.js
│  │  ├─ resource.js
│  │  ├─ booking.js
│  │  ├─ bookingResource.js
│  │  └─ departmentCredit.js
│  ├─ routes.js
│  ├─ controllers/
│  │  ├─ bookingController.js
│  │  ├─ searchController.js
│  │  ├─ approvalController.js
│  │  └─ seedController.js
│  ├─ services/
│  │  ├─ emailService.js
│  │  └─ icsGenerator.js
│  ├─ cron/
│  │  └─ jobs.js
│  └─ middleware/
│     └─ auth.js
└─ README.md
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env` with your configuration.

## Usage

```bash
npm run start  (or `npm run dev` with nodemon)
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
} -->
