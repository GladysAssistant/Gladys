// A thermostat param naming its window or temperature sensors holds either one
// selector — the format every device saved before several were allowed carries —
// or a JSON array of them (docs/specs/thermostat.md A.1.1). Shared by the server
// regulation loop, the device migration, the edit page and the dashboard widget,
// so every reader agrees on what the param says.

/**
 * @description Read a sensor param as a list of selectors.
 * A malformed array is read as a single selector rather than throwing: the loop
 * then finds no sensor by that name, instead of failing the whole pass.
 * @param {*} value - Raw param value: a selector, a JSON array of selectors, or empty.
 * @returns {Array<string>} The selectors, without empty or duplicate entries.
 * @example
 * parseSelectorList('["salon-window","kitchen-door"]'); // ['salon-window', 'kitchen-door']
 * parseSelectorList('salon-window'); // ['salon-window']
 */
function parseSelectorList(value) {
  if (value === null || value === undefined) {
    return [];
  }
  let list = [value];
  if (Array.isArray(value)) {
    list = value;
  } else if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      // Text starting with `[` that parses is an array: JSON allows nothing else.
      list = JSON.parse(value);
    } catch (e) {
      list = [value];
    }
  }
  const selectors = [];
  list.forEach((selector) => {
    if (typeof selector !== 'string') {
      return;
    }
    const trimmed = selector.trim();
    if (trimmed !== '' && !selectors.includes(trimmed)) {
      selectors.push(trimmed);
    }
  });
  return selectors;
}

/**
 * @description Write a list of selectors back as a param value.
 * A single sensor stays a plain selector, so a device with one sensor carries
 * exactly what it did before several were allowed.
 * @param {Array<string>} selectors - The selectors to store.
 * @returns {string} The param value: '' for none, the selector for one, a JSON array otherwise.
 * @example
 * serializeSelectorList(['salon-window']); // 'salon-window'
 */
function serializeSelectorList(selectors) {
  const list = parseSelectorList(selectors);
  if (list.length === 0) {
    return '';
  }
  if (list.length === 1) {
    return list[0];
  }
  return JSON.stringify(list);
}

module.exports = {
  parseSelectorList,
  serializeSelectorList,
};
