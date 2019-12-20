const basic = require('./switch_basic');
const s2x = require('./plug_s2x');
const pow = require('./switch_pow');
const dualR2 = require('./switch_dual_r2');
const alLC01 = require('./light_al_lc01');
const sv = require('./switch_sv');
const dual = require('./switch_dual');

module.exports = {
  1: basic,
  3: sv,
  5: dual,
  6: pow,
  8: s2x,
  37: alLC01,
  39: dualR2,
};
