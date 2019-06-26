const { create } = require('./area.create');
const { destroy } = require('./area.destroy');
const { get } = require('./area.get');
const { update } = require('./area.update');

const Area = function Area() {};

Area.prototype.create = create;
Area.prototype.destroy = destroy;
Area.prototype.get = get;
Area.prototype.update = update;

module.exports = Area;
