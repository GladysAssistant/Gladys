const switchBasic = require('./switch_basic');
const switchTh = require('./switch_th');
const switchPow = require('./switch_pow');
const unhandled = require('./unhandled');

module.exports = {
  1: switchBasic,
  2: switchBasic,
  3: switchBasic,
  4: switchBasic,
  6: switchBasic,
  7: switchBasic,
  8: switchBasic,
  9: switchBasic,
  14: switchBasic,
  5: switchPow,
  15: switchTh,
  unhandled,
};
