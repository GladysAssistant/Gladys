const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];

// Formatted in the given language, with its own unit names and decimal
// separator: "50,6 ko" in French, "50.6 kB" in English. Without a language,
// the browser's is used.
const formatBytes = (bytes, language) => {
  let value = bytes || 0;
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < UNITS.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }
  return new Intl.NumberFormat(language, {
    style: 'unit',
    unit: UNITS[unitIndex],
    unitDisplay: 'short',
    maximumFractionDigits: unitIndex === 0 ? 0 : 1
  }).format(value);
};

export default formatBytes;
