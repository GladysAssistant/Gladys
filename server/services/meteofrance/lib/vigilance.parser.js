// Official Météo France vigilance phenomenon ids (the warning API only returns ids)
/** @type {Object<string, string>} */
const PHENOMENON_NAMES = {
  1: 'Vent violent',
  2: 'Pluie-inondation',
  3: 'Orages',
  4: 'Crues',
  5: 'Neige-verglas',
  6: 'Canicule',
  7: 'Grand froid',
  8: 'Avalanches',
  9: 'Vagues-submersion',
};

/**
 * @description Parse warning raw data and return filtered alerts array.
 * @param {any} warningData - Raw warning/full API response.
 * @param {string} dept - French department number.
 * @returns {Array<object>} Filtered alert objects.
 * @example
 * const alerts = parseAlerts(warningData, '71');
 */
function parseAlerts(warningData, dept) {
  /** @type {Array<{ phenomenon_id: string, phenomenon_max_color_id: number }>} */
  const items = (warningData && warningData.phenomenons_items) || [];
  return items
    .filter((p) => p.phenomenon_max_color_id >= 2)
    .map((p) => ({
      dept,
      color: p.phenomenon_max_color_id,
      phenomene_id: parseInt(p.phenomenon_id, 10),
      phenomene_nom: PHENOMENON_NAMES[p.phenomenon_id] || `Phénomène ${p.phenomenon_id}`,
    }));
}

/**
 * @description Extract the vigilance bulletin text from warning data.
 * @param {any} warningData - Raw warning/full API response.
 * @returns {string} Bulletin text (empty string when not found).
 * @example
 * const text = parseVigilanceText(warningData);
 */
function parseVigilanceText(warningData) {
  /** @type {string[]} */
  const texts = [];
  // The bulletin structure varies: walk it and collect textual leaves under "text" keys
  const walk = (/** @type {any} */ node) => {
    if (!node) {
      return;
    }
    if (typeof node === 'string') {
      if (node.trim()) {
        texts.push(node.trim());
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === 'object') {
      Object.keys(node).forEach((key) => {
        if (key === 'text' || key === 'text_items') {
          walk(node[key]);
        } else if (typeof node[key] === 'object') {
          walk(node[key]);
        }
      });
    }
  };
  walk([warningData && warningData.text, warningData && warningData.text_avalanche]);
  return texts.join('\n');
}

module.exports = {
  PHENOMENON_NAMES,
  parseAlerts,
  parseVigilanceText,
};
