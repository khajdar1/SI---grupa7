const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    userId: 9,
    username: 'nedux',
    email: 'n@gmail.com',
    role: 'ADMIN',
  },
  'change-me',
  { expiresIn: '1h' }
);
console.log('JWT:', token);

// Now fetch the API
fetch('http://localhost:4000/api/v1/users/8', { // user 8 is testuser99
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
  },
  body: JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    email: 'test99@test.com',
    role: 'KOORDINATOR',
  })
}).then(res => res.text()).then(text => console.log('API response:', text))
  .catch(err => console.error(err));
