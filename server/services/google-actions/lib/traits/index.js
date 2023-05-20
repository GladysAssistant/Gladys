const { brightnessTrait } = require('./googleActions.brightness.trait');
const { colorSettingTrait } = require('./googleActions.colorSetting.trait');
const { onOffTrait } = require('./googleActions.onOff.trait');
const { openCloseTrait } = require('./googleActions.openClose.trait');
const { volumeTrait } = require('./googleActions.volume.trait');

const TRAITS = [brightnessTrait, colorSettingTrait, onOffTrait, openCloseTrait, volumeTrait];

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
