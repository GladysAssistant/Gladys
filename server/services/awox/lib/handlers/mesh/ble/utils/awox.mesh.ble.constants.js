const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../../../utils/constants');
const { FEATURES } = require('../../../../utils/awox.features');

const COMMANDS = {
  AUTHENTICATE: [0x01, 0x00],
};

const DEVICE_GROUPS = {
  MESH_LIGHT_WHITE: 'mesh_light_white',
  MESH_LIGHT_COLOR: 'mesh_light_color',
  MESH_PLUG: 'mesh_plug',
};

const DEVICE_MODEL_GROUPS = {
  [DEVICE_GROUPS.MESH_LIGHT_WHITE]: [
    4116,
    4118,
    4129,
    4169,
    4170,
    4176,
    4196,
    4207,
    4209,
    4211,
    4213,
    4224,
    4225,
    4226,
    4227,
    4231,
    4233,
    4234,
    4243,
    4244,
    4245,
    4247,
    4248,
    4250,
    4251,
    4260,
    4261,
    4262,
    4263,
    4266,
    4267,
    4269,
  ],
  [DEVICE_GROUPS.MESH_LIGHT_COLOR]: [
    4115,
    4117,
    4119,
    4130,
    4131,
    4132,
    4133,
    4134,
    4135,
    4137,
    4138,
    4139,
    4144,
    4146,
    4147,
    4148,
    4149,
    4150,
    4151,
    4152,
    4154,
    4155,
    4156,
    4157,
    4159,
    4160,
    4161,
    4162,
    4163,
    4164,
    4165,
    4166,
    4167,
    4168,
    4171,
    4172,
    4173,
    4174,
    4175,
    4177,
    4179,
    4180,
    4181,
    4182,
    4183,
    4185,
    4186,
    4187,
    4188,
    4201,
    4215,
    4216,
    4217,
    4218,
    4219,
    4220,
    4221,
    4222,
    4232,
    4242,
    4246,
    4249,
    4257,
    4258,
    4259,
    4264,
    4265,
    4268,
  ],
  [DEVICE_GROUPS.MESH_PLUG]: [
    4194,
    4195,
    4199,
    4200,
    4228,
    4229,
    4230,
    4235,
    4236,
    4237,
    4238,
    4239,
    4240,
    4252,
    4253,
    4254,
    4255,
    4256,
  ],
};

const DEVICE_MODEL_FEATURES = {
  [DEVICE_GROUPS.MESH_LIGHT_WHITE]: [
    FEATURES[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BINARY],
    FEATURES[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS],
    FEATURES[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE],
  ],
  [DEVICE_GROUPS.MESH_LIGHT_COLOR]: [
    FEATURES[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BINARY],
    FEATURES[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS],
    FEATURES[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE],
    FEATURES[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.COLOR],
  ],
  [DEVICE_GROUPS.MESH_PLUG]: [FEATURES[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.BINARY]],
};

const DEVICE_MODEL_KEYS = Object.values(DEVICE_MODEL_GROUPS).flat();

module.exports = {
  COMMANDS,
  DEVICE_MODEL_KEYS,
  DEVICE_MODEL_GROUPS,
  DEVICE_MODEL_FEATURES,
};
