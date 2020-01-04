const sonoffBasic = require('./switch_sonoff_basic');
const sonoffRF = require('./switch_sonoff_rf');
const sonoffSV = require('./switch_sonoff_sv');
const sonoffTH = require('./switch_sonoff_th');
const sonoffDual = require('./switch_sonoff_dual');
const sonoffPow = require('./switch_sonoff_pow');
const sonoff4ch = require('./switch_sonoff_4ch');
const wion = require('./plug_wion');
const sonoff4chPro = require('./switch_sonoff_4ch_pro');
const huafanSS = require('./plug_huafan_ss');
const sonoffB1 = require('./light_sonoff_b1');
const sonoffT11Ch = require('./switch_sonoff_t1_1ch');
const sonoffT12Ch = require('./switch_sonoff_t1_2ch');
const sonoffT13Ch = require('./switch_sonoff_t1_3ch');
const yunshanRelay = require('./switch_yunshan_relay');
const kmc70011 = require('./plug_kmc_70011');
const sonoffS2x = require('./plug_sonoff_s2x');
const slampher = require('./light_slampher');
const sonoffTouch = require('./switch_sonoff_touch');
const sonoffLED = require('./light_sonoff_led');
const sonoff1Channel = require('./switch_sonoff_1_channel');
const sonoff4Channel = require('./switch_sonoff_4_channel');
const ariluxLC01 = require('./light_arilux_lc01');
const sonoffDualR2 = require('./switch_sonoff_dual_r2');
const sonoffS31 = require('./plug_sonoff_s31');
const sonoffPowR2 = require('./switch_sonoff_pow_r2');
const blitzwolfSHP = require('./plug_blitzwolf_shp');
const shelly1 = require('./switch_shelly_1');
const shelly2 = require('./switch_shelly_2');
const espSwitCh = require('./switch_esp_switch');
const neoCoolcam = require('./plug_neo_coolcam');
const obiSocket = require('./plug_obi_socket');
const obiSocket2 = require('./plug_obi_socket_2');
const ka10 = require('./plug_ka10');
const sp10 = require('./plug_sp10');
const wagaCHCZ02MB = require('./plug_waga_chcz02mb');

module.exports = {
  1: sonoffBasic,
  2: sonoffRF,
  3: sonoffSV,
  4: sonoffTH,
  5: sonoffDual,
  6: sonoffPow,
  7: sonoff4ch,
  8: sonoffS2x,
  9: slampher,
  10: sonoffTouch,
  11: sonoffLED,
  12: sonoff1Channel,
  13: sonoff4Channel,
  17: wion,
  23: sonoff4chPro,
  24: huafanSS,
  26: sonoffB1,
  28: sonoffT11Ch,
  29: sonoffT12Ch,
  30: sonoffT13Ch,
  33: yunshanRelay,
  36: kmc70011,
  37: ariluxLC01,
  39: sonoffDualR2,
  41: sonoffS31,
  43: sonoffPowR2,
  45: blitzwolfSHP,
  46: shelly1,
  47: shelly2,
  49: neoCoolcam,
  50: espSwitCh,
  51: obiSocket,
  61: obiSocket2,
  64: ka10,
  67: sp10,
  68: wagaCHCZ02MB,
};
