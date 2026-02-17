// INSERT INTO smart_workspace.departments (name, monthlyCreditQuota, isActive, createdAt, updatedAt)
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

// update smart_workspace.rooms set isDefaultLocation = 1 where id = 1;

// update smart_workspace.resource set isMovable = 0 where id = 1;

// delete from smart_workspace.user where id = 1;



// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

// rooms

// ALTER TABLE rooms ADD COLUMN isDefaultLocation BOOLEAN DEFAULT FALSE;
// ✔ One room will be DEFAULT storage
// ✔ Holds overflow resources

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

// NEW
// room_resource_capacity
// Room-wise max capacity per resource

// CREATE TABLE room_resource_capacity (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   roomId INT NOT NULL,
//   resourceId INT NOT NULL,
//   maxCapacity INT NOT NULL,
//   UNIQUE(roomId, resourceId)
// );

// | room   | resource | max |
// | ------ | -------- | --- |
// | Room A | Chair    | 7   |
// | Room B | Chair    | 10  |
// | Room A | TV       | 1   |
// | Room B | TV       | 2   |

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

// NEW
// room_resource_stock
// Actual physical location of resources

// CREATE TABLE room_resource_stock (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   roomId INT NOT NULL,
//   resourceId INT NOT NULL,
//   quantity INT NOT NULL,
//   UNIQUE(roomId, resourceId)
// );


// | room    | qty |
// | ------- | --- |
// | Room A  | 7   |
// | Room B  | 10  |
// | DEFAULT | 3   |


// ----------------------------------------------------------------------

// ----------------------------------------------------------------------


// booking_resources

// ALTER TABLE booking_resources ADD COLUMN fromRoomId INT, ADD COLUMN toRoomId INT;

// ✔ Track borrow
// ✔ Track return location

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------


loced credit for last date of month

resource type

room approval 

max booking time in day


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