const DIRECTIVE_NAMESPACES = {
  PowerController: 'Alexa.PowerController',
  BrightnessController: 'Alexa.BrightnessController',
  ColorController: 'Alexa.ColorController',
  ModeController: 'Alexa.ModeController',
  RangeController: 'Alexa.RangeController',
};

const BLIND_MODE_CONTROLLER_INSTANCE = 'Blinds.Position';
const BLIND_RANGE_CONTROLLER_INSTANCE = 'Blind.Lift';

const BLIND_MODES = {
  UP: 'Position.Up',
  DOWN: 'Position.Down',
};

module.exports = {
  DIRECTIVE_NAMESPACES,
  DIRECTIVE_NAMESPACES_LIST: Object.values(DIRECTIVE_NAMESPACES),
  BLIND_MODE_CONTROLLER_INSTANCE,
  BLIND_RANGE_CONTROLLER_INSTANCE,
  BLIND_MODES,
};
