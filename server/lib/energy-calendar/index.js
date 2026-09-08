const { getDayTypes } = require('./energyCalendar.getDayTypes');

const EnergyCalendar = function EnergyCalendar(service) {
  this.service = service;
};

EnergyCalendar.prototype.getDayTypes = getDayTypes;

module.exports = EnergyCalendar;
