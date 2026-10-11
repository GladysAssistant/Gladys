const PRESET_COLORS = {
  // Grey, not a red: #fa5252 sat right next to Away's #e03131, and the two
  // swatches read as the same colour in the form and on the schedule bars. Off is
  // also the only entry here that is not a temperature to reach — it is the
  // heating not running — so a neutral says what it is as well as telling it
  // apart.
  off: '#868e96',
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

/**
 * Black or white, whichever reads on that background. The presets span a ninefold
 * range of luminance — #0d3b8e for the night, #74c0fc for the frost — so one text
 * colour cannot serve them all, and a per-preset table would drift the moment a
 * colour is edited. The two contrast ratios are compared rather than the
 * luminance against the usual 0.179 cut: on the away red (#e03131, luminance
 * 0.183) that cut picks black, which gives 3.42:1, where white gives 4.51:1 and
 * clears AA. Every preset reaches at least 4.5:1 this way.
 * @param {string} hex - Background colour, as #rrggbb.
 * @returns {string} The text colour to use on it.
 */
export const readableTextOn = hex => {
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) {
    return '#212529';
  }
  const channel = value => {
    const c = parseInt(value, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = color =>
    0.2126 * channel(color.slice(1, 3)) + 0.7152 * channel(color.slice(3, 5)) + 0.0722 * channel(color.slice(5, 7));
  const against = textColor => {
    const [lighter, darker] = [luminance(hex), luminance(textColor)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
  };
  return against('#212529') >= against('#ffffff') ? '#212529' : '#ffffff';
};

export default PRESET_COLORS;
