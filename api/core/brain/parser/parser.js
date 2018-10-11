var Promise = require('bluebird');
var parseDeviceType = require('./parser.devicetype.js');
var parseRoom = require('./parser.room.js');
var parseHouse = require('./parser.house.js');
var parseTime = require('./parser.time.js');

module.exports.parse = function parse(text) {

    var deviceTypes = [];
    var rooms = [];
    var houses = [];
    var times = [];
    var replacedText = '';

    return parseRoom(text)
        .then((result) => {

            rooms = result.rooms;
            
            return parseDeviceType(result.text);
        })
        .then((result) => {

            deviceTypes = result.deviceTypes;
            
            return parseTime(result.text);
        })
        .then((result) => {

            times = result.times;

            return parseHouse(result.text);
        }) 
        .then((result) => {

            houses = result.houses;
            allHouses = result.allHouses;
            replacedText = result.text;

            return Promise.resolve({deviceTypes, rooms, houses, times, replacedText, allHouses});
        });
};