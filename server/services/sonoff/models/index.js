const basic = require('./switch_basic');
const s26 = require('./plug_s26');
const pow = require('./switch_pow');

module.exports = {
  1: basic,
  6: s26,
  8: pow,
};
