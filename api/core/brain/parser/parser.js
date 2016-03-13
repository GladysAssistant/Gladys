var Promise = require('bluebird');
var parseDeviceType = require('./parser.devicetype.js');
var parseRoom = require('./parser.room.js');
var parseTime = require('./parser.time.js');

module.exports.parse = function parse(text){
    return Promise.join(parseDeviceType(text), parseRoom(text), parseTime(text), function(deviceTypes, rooms, times){
          return Promise.resolve({deviceTypes, rooms, times});
      });
};