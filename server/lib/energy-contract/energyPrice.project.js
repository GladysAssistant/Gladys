const { ENERGY_PRICE_TYPES, ENERGY_CONTRACT_TYPES } = require('../../utils/constants');
const { PRICE_SCALE } = require('./legacy/convertPriceRows');

/**
 * @description Convert engine time intervals back to the legacy `hour_slots` string.
 * @param {Array<Array<string>>} time - [["22:00", "06:00"]].
 * @returns {string} "22:00,22:30,…".
 * @example
 * timeToHourSlots([['22:00', '00:00']]); // '22:00,22:30,23:00,23:30'
 */
function timeToHourSlots(time) {
  const slots = [];
  const toMinutes = (label) => {
    const [h, m] = label.split(':').map(Number);
    return h * 60 + m;
  };
  (time || []).forEach(([start, end]) => {
    const startMinutes = toMinutes(start);
    let endMinutes = toMinutes(end);
    if (endMinutes <= startMinutes) {
      endMinutes += 1440;
    }
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const m = minutes % 1440;
      slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
  });
  return slots.join(',');
}

/**
 * @description Project the contracts onto the legacy `energy_price` shape (section 9.4:
 * `GET /api/v1/energy_price` keeps answering for two releases): one synthetic row per
 * consumption rule and per fixed component. Rules the legacy shape cannot express (seasons,
 * tiers, calendars other than Tempo) are projected with their price and no slot.
 * @param {object} [options] - `electric_meter_device_id` filter.
 * @returns {Promise<Array<object>>} Legacy rows.
 * @example
 * await getLegacyPrices({ electric_meter_device_id: '…' });
 */
async function getLegacyPrices(options = {}) {
  const contracts = await this.get(options);
  const rows = [];
  contracts.forEach((contract) => {
    const isTempo = Array.isArray(contract.tariff.calendars) && contract.tariff.calendars.includes('tempo');
    const legacyContract = (() => {
      if (isTempo) {
        return ENERGY_CONTRACT_TYPES.EDF_TEMPO;
      }
      const hasTime = contract.tariff.components.some(
        (c) => c.kind === 'consumption' && c.rules.some((r) => r.when && r.when.time),
      );
      return hasTime ? ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK : ENERGY_CONTRACT_TYPES.BASE;
    })();
    const base = {
      contract_name: contract.name,
      contract: legacyContract,
      currency: contract.currency === 'EUR' ? 'euro' : contract.currency,
      start_date: contract.valid_from,
      end_date: contract.valid_to,
      electric_meter_device_id: contract.electric_meter_device_id,
      subscribed_power: contract.subscribed_power === null ? null : String(contract.subscribed_power),
      energy_contract_id: contract.id,
      energy_contract_selector: contract.selector,
      created_at: contract.created_at,
      updated_at: contract.updated_at,
    };
    contract.tariff.components.forEach((component, componentIndex) => {
      if (component.kind === 'consumption') {
        const specs = [...component.rules, ...(component.fallback ? [{ ...component.fallback, fallback: true }] : [])];
        specs.forEach((rule, ruleIndex) => {
          if (typeof rule.price !== 'number') {
            return;
          }
          const when = rule.when || {};
          rows.push({
            ...base,
            id: `${contract.id}:${componentIndex}:${ruleIndex}`,
            selector: `${contract.selector}-${component.key}-${ruleIndex}`,
            price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
            price: Math.round(rule.price * PRICE_SCALE),
            hour_slots: when.time ? timeToHourSlots(when.time) : null,
            day_type: when.calendar && typeof when.calendar.tempo === 'string' ? when.calendar.tempo : null,
            label: rule.label || null,
          });
        });
      } else if (component.kind === 'fixed' && typeof component.amount === 'number') {
        rows.push({
          ...base,
          id: `${contract.id}:${componentIndex}`,
          selector: `${contract.selector}-${component.key}`,
          price_type: ENERGY_PRICE_TYPES.SUBSCRIPTION,
          price: Math.round(component.amount * PRICE_SCALE),
          hour_slots: null,
          day_type: null,
          label: component.label || null,
        });
      }
    });
  });
  return rows;
}

module.exports = { getLegacyPrices, timeToHourSlots };
