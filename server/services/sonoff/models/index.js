const basic = require('./switch_basic');
const s2x = require('./plug_s2x');
const pow = require('./switch_pow');

module.exports = {
  1: basic,
  6: pow,
  8: s2x,
};
