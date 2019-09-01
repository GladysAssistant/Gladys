const { list } = require('./device.list');
const { create } = require('./device.create');
const { destroy } = require('./device.destroy');
const { createEvent } = require('./device.createEvent');

module.exports = {
  list,
  create,
  destroy,
  createEvent,
};
