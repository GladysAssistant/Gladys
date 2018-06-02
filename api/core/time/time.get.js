const moment = require('moment');
const Promise = require('bluebird');

module.exports = function get(options){
  var now = moment();
  return Promise.resolve(now);  
};