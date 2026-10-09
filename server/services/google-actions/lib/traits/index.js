const { brightnessTrait } = require('./googleActions.brightness.trait');
const { colorSettingTrait } = require('./googleActions.colorSetting.trait');
const { humiditySettingTrait } = require('./googleActions.humiditySetting.trait');
const { onOffTrait } = require('./googleActions.onOff.trait');
const { openCloseTrait } = require('./googleActions.openClose.trait');
const { temperatureControlTrait } = require('./googleActions.temperatureControl.trait');

const TRAITS = [
  brightnessTrait,
  colorSettingTrait,
  humiditySettingTrait,
  onOffTrait,
  openCloseTrait,
  temperatureControlTrait,
];

const TRAIT_BY_COMMAND = {};
TRAITS.forEach((trait) => {
  Object.keys(trait.commands).forEach((commandKey) => {
    TRAIT_BY_COMMAND[commandKey] = trait;
  });
});

module.exports = {
  TRAITS,
  TRAIT_BY_COMMAND,
};
