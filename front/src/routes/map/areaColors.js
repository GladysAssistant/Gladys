// The colors a zone can take: the same list for the select of the desktop form (ColorPicker.jsx)
// and the swatches of the phone layout. labelKey is a key of the `color` translations.
const AREA_COLORS = [
  { value: '#3498db', labelKey: 'blue', contrast: 'white' },
  { value: '#e74c3c', labelKey: 'red', contrast: 'white' },
  { value: '#2ecc71', labelKey: 'green', contrast: 'white' },
  { value: '#2c3e50', labelKey: 'black', contrast: 'white' },
  { value: '#f1c40f', labelKey: 'yellow', contrast: 'black' },
  { value: '#8e44ad', labelKey: 'purple', contrast: 'white' }
];

const DEFAULT_AREA_COLOR = AREA_COLORS[0].value;

export { AREA_COLORS, DEFAULT_AREA_COLOR };
