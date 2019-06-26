const { create } = require('./location.create');
const { get } = require('./location.get');
const { getLast } = require('./location.getLast');

const Location = function Location() {};

Location.prototype.create = create;
Location.prototype.get = get;
Location.prototype.getLast = getLast;

module.exports = Location;
