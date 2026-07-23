const { kelvinToRGB, rgbToInt, intToHex } = require('../../../server/utils/colors');

const kelvinToHex = kelvin => `#${intToHex(rgbToInt(kelvinToRGB(kelvin)))}`;

const BASIC_COLOR_PALETTE = [
  { hex: '#FF0000', labelKey: 'color.red' },
  { hex: '#FF8000', labelKey: 'color.orange' },
  { hex: '#FFFF00', labelKey: 'color.yellow' },
  { hex: '#00FF00', labelKey: 'color.green' },
  { hex: '#00FFFF', labelKey: 'color.aqua' },
  { hex: '#0000FF', labelKey: 'color.blue' },
  { hex: '#8000FF', labelKey: 'color.purple' },
  { hex: '#FF00FF', labelKey: 'color.pink' }
];

const WHITE_COLOR_PALETTE = [
  { hex: kelvinToHex(6500), labelKey: 'colorPicker.coolWhite' },
  { hex: kelvinToHex(4000), labelKey: 'colorPicker.neutralWhite' },
  { hex: kelvinToHex(2700), labelKey: 'colorPicker.warmWhite' }
];

const COLOR_PALETTE = [...BASIC_COLOR_PALETTE, ...WHITE_COLOR_PALETTE];

module.exports = {
  BASIC_COLOR_PALETTE,
  WHITE_COLOR_PALETTE,
  COLOR_PALETTE
};
