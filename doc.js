// INSERT INTO departments (name, monthlyCreditQuota, isActive, createdAt, updatedAt)
// VALUES
//   ('Engineering', 100, 1, NOW(), NOW()),
//   ('Sales', 100, 1, NOW(), NOW()),
//   ('Electronics & IoT', 100, 1, NOW(), NOW()),
//   ('HR', 100, 1, NOW(), NOW()),
//   ('Marketing', 100, 1, NOW(), NOW()),
//   ('Finance', 100, 1, NOW(), NOW()),
//   ('Operations', 100, 1, NOW(), NOW()),
//   ('Customer Support', 100, 1, NOW(), NOW());


// update smart_workspace.user set role = "admin" where id = 1;











//  openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

//  git remote add origin https://github.com/tarangvaghani09/workspace.git


// for(let i=0;i<100;i++){
//   fetch("https://localhost/api/login",{
//     method:"POST",
//     headers:{"Content-Type":"application/json"},
//     body:JSON.stringify({email:"alice@example.com",password:"123456"
//     })
//   })
//   .then(r=>console.log(r.status,r.headers.get("X-Rate-Limit")));
// }

// for(let i=0;i<100;i++){
//   fetch("https://localhost/api/approvals/pending",{
//     method:"GET",
//     headers:{"Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiZGVwYXJ0bWVudElkIjoxLCJpYXQiOjE3Njk0OTAwNTAsImV4cCI6MTc2OTU3NjQ1MH0.Y4my2sgS0G3MW0F3dfXg4SMkoE9-TVxfovIk5B3ykVk`,"Content-Type":"application/json"
//     }
//   })
//   .then(r=>console.log(r.status,r.headers.get("X-Rate-Limit")));
// }

// for(let i=0;i<100;i++){
//   fetch("/api/departments")
//   .then(r=>{console.log(r.status,r.headers.get("X-Rate-Limit-By"))
//   })
// }

//  for(let i=0;i<100;i++){
//   fetch("/api/departments")
//   .then(r=>console.log(r.status))
// }