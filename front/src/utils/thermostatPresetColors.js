const PRESET_COLORS = {
  off: '#fa5252',
  frost: '#74c0fc',
  away: '#e03131',
  eco: '#74b816',
  night: '#0d3b8e',
  comfort: '#f59f00'
};

// Comfort is the only preset whose colour depends on the mode: it means "the
// temperature you want when you are here", which is warm when heating and cold
// when cooling. The amber above would label a running air conditioner in the
// colour of heat. Every other preset keeps one colour in both modes — frost,
// away, eco and night name a situation, not a temperature to reach.
const COMFORT_COOLING_COLOR = '#3b82f6';

/**
 * Colour of a preset, for the mode the thermostat runs in. Callers that have no
 * mode — the schedule editor, where a schedule can be shared between a heating
 * and a cooling thermostat — omit it and get the heating colours.
 */
export const getPresetColor = (presetKey, mode) => {
  if (presetKey === 'comfort' && mode === 'cooling') {
    return COMFORT_COOLING_COLOR;
  }
  return PRESET_COLORS[presetKey] || PRESET_COLORS.comfort;
};

export default PRESET_COLORS;
