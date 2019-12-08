const basic = require('./switch_basic');
const s2x = require('./plug_s2x');
const pow = require('./switch_pow');
const dualR2 = require('./switch_dual_r2');

module.exports = {
  1: basic,
  6: pow,
  8: s2x,
  39: dualR2,
};
