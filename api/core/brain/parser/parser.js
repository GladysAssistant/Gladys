var Promise = require('bluebird');
var parseDeviceType = require('./parser.devicetype.js');
var parseRoom = require('./parser.room.js');
var parseHouse = require('./parser.house.js');
var parseTime = require('./parser.time.js');
var parseChannel = require('./parser.channel.js');
var parseWord = require('./parser.word.js');
var parsePercentage = require('./parser.percentage.js');

module.exports.parse = function parse(data) {

  var deviceTypes = [];
  var rooms = [];
  var houses = [];
  var times = [];
  var words = [];
  var percentage = [];
  var replacedText = '';
  var answerRoom = false;

  return parseWord(data)
    .then((result) => {
     
      words = result.words;

      return parseRoom(result.data);
    })
    .then((result) => {

      rooms = result.rooms;
      answerRoom = result.answerRoom;
            
      return parseDeviceType(result.text);
    })
    .then((result) => {

      deviceTypes = result.deviceTypes;

      return parsePercentage(result.text);
    })
    .then((result) => {

      percentage = result.percentage;

      return parseTime(result.text);
    }) 
    .then((result) => {

      times = result.times;

      return parseHouse(result.text);
    })
    .then((result) => {
            
      houses = result.houses;
      allHouses = result.allHouses;

      return parseChannel(result.text);
    })
    .then((result) => {
            
      channel = result.channel;

      replacedText = result.text;

      return Promise.resolve({deviceTypes, rooms, houses, channel, times, words, percentage, replacedText, allHouses, answerRoom});
    });
};
