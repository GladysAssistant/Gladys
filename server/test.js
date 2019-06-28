const pathToRegexp = require('path-to-regexp');

let keys = [];
let regex = pathToRegexp('/api/v1/user/:user_selector', keys);
console.log(regex.exec('/api/v1/user/tony'), keys);
// regex = pathToRegexp('/api/v1/house/:house_selector/room/:room_selector', keys);
// console.log(regex.exec('/api/v1/house/my-house/room/my-room'), keys);
