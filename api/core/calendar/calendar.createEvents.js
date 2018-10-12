const Promise = require('bluebird');

module.exports = function createEvents(events) {
  return Promise.map(events, function(event){
    return gladys.calendar.createEvent(event);
  });
};