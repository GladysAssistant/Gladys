var shared = require('./paramUser.shared.js');

module.exports = function(name, userId, value){
  if(!shared.cache.hasOwnProperty(userId)){
    shared.cache[userId] = {};
    shared.cache[userId][name] = value;
  } else {
    shared.cache[userId][name] = value;
  }
};