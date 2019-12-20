const sonoffBasic = require('./switch_sonoff_basic');
const sonoffSV = require('./switch_sonoff_sv');
const sonoffDual = require('./switch_sonoff_dual');
const sonoffPow = require('./switch_sonoff_pow');
const sonoff4ch = require('./switch_sonoff_4ch');
const sonoffS2x = require('./plug_sonoff_s2x');
const slampher = require('./light_slampher');
const sonoffTouch = require('./switch_sonoff_touch');
const ariluxLC01 = require('./light_arilux_lc01');
const sonoffDualR2 = require('./switch_sonoff_dual_r2');

module.exports = {
  1: sonoffBasic,
  3: sonoffSV,
  5: sonoffDual,
  6: sonoffPow,
  7: sonoff4ch,
  8: sonoffS2x,
  9: slampher,
  10: sonoffTouch,
  37: ariluxLC01,
  39: sonoffDualR2,
};
