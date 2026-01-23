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