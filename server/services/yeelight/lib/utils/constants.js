const DEVICE_SERVICE_ID = 'yeelight';
const DEVICE_EXTERNAL_ID_BASE = 'yeelight';
const DEVICE_IP_ADDRESS = 'IP_ADDRESS';
const DEVICE_PORT_ADDRESS = 'PORT_ADDRESS';

const DEVICES_MODELS = {
  mono: 'White',
  color: 'RGBW',
  stripe: 'Stripe',
  ceiling1: 'Ceiling',
  ceiling: 'Ceiling color',
  bslamp1: 'Bedside',
  bslamp: 'Bedside',
  desklamp: 'Desklamp',
};

const COMMAND_TYPE = {
  SET_POWER: 'set_power',
  TOGGLE: 'toggle',
  SET_DEFAULT: 'set_default',
  START_COLOR_FLOW: 'start_cf',
  STOP_COLOR_FLOW: 'stop_cf',
  GET_PROPS: 'get_prop',
  SET_SCENE: 'set_scene',
  SET_CT_ABX: 'set_ct_abx',
  SET_RGB: 'set_rgb',
  SET_HSV: 'set_hsv',
  SET_BRIGHT: 'set_bright',
  CRON_ADD: 'cron_add',
  CRON_GET: 'cron_get',
  CRON_DEL: 'cron_del',
  SET_ADJUST: 'set_adjust',
  SET_MUSIC: 'set_music',
  SET_NAME: 'set_name',
  ADJUST_BRIGHT: 'adjust_bright',
  ADJUST_CT: 'adjust_ct',
  ADJUST_COLOR: 'adjust_color',
};

module.exports = {
  DEVICE_SERVICE_ID,
  DEVICE_EXTERNAL_ID_BASE,
  DEVICE_IP_ADDRESS,
  DEVICE_PORT_ADDRESS,
  DEVICES_MODELS,
  COMMAND_TYPE,
};
