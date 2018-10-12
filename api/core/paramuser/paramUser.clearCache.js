var shared = require('./paramUser.shared.js');

module.exports = function(){
  shared.cache = {};
  return Promise.resolve();
};