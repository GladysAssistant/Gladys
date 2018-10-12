var shared = require('./param.shared.js');

module.exports = function(){
  shared.cache = {};
  return Promise.resolve();
};