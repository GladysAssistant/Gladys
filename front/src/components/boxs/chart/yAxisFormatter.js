const yAxisFormatter = value => {
  if (Number.isNaN(value)) {
    return value;
  }
  // Handle zero as a special case
  if (value === 0) {
    return '0';
  }

  // Round to 4 significant digits
  const significantDigits = 4;
  const roundedValue = parseFloat(value.toPrecision(significantDigits));

  // For very small or very large numbers, use scientific notation
  if (Math.abs(roundedValue) < 0.001 || Math.abs(roundedValue) >= 1e9) {
    return roundedValue.toExponential(2); // Scientific notation with 2 decimals
  }

  // For normal values, format with up to 2 decimal places
  return value.toFixed(2);
};

export { yAxisFormatter };
