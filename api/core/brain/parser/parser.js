var Promise = require('bluebird');
var parseDeviceType = require('./parser.devicetype.js');
var parseRoom = require('./parser.room.js');

module.exports.parse = function parse(text){
    return Promise.join(parseDeviceType(text), parseRoom(text), function(deviceTypes, rooms){
          return Promise.resolve({deviceTypes, rooms});
      });
};