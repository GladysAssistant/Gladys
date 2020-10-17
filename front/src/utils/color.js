function isBright(color) {
  const rgb = parseInt(color.substring(1), 16); // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff; // extract red
  const g = (rgb >> 8) & 0xff; // extract green
  const b = (rgb >> 0) & 0xff; // extract blue

  return (299 * r + 587 * g + 114 * b) / 1000 > 130;
}

export { isBright };
