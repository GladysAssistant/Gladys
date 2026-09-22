const axios = require('axios');
const logger = require('../../utils/logger');
const { ENERGY_CONTRACT_PROVIDER_KINDS, ENERGY_CONTRACT_PRICING_MODES } = require('../../utils/constants');
const { convertPriceRows } = require('./legacy/convertPriceRows');
const { toIsoCurrency } = require('./migration.fromEnergyPrice');

const RELEASE_URL = 'https://api.github.com/repos/GladysAssistant/energy-contracts/releases/latest';
const V2_ASSET = 'contracts-v2.json';
const V1_ASSET = 'contracts.json';
const CATALOGUE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * @description Build the tariff of one v1 catalogue variant (one contract key, one power):
 * the latest validity range gives the rules and the fallback, older ranges become rules
 * (and fixed components) scoped by a `dates` condition, placed first.
 * @param {Array<object>} rows - Price rows of the variant.
 * @returns {object} { tariff, inputs, calendars, contractType }.
 * @example
 * buildVariantTariff(rows);
 */
function buildVariantTariff(rows) {
  const ranges = Array.from(new Set(rows.map((r) => `${r.start_date}|${r.end_date || ''}`)))
    .map((id) => ({ id, start: id.split('|')[0], end: id.split('|')[1] || null }))
    .sort((a, b) => (a.start < b.start ? 1 : -1));
  const energy = { key: 'energy', kind: 'consumption', rules: [] };
  const fixed = [];
  const inputs = [];
  let calendars = [];
  let contractType;
  ranges.forEach((range, rangeIndex) => {
    const rangeRows = rows.filter((r) => `${r.start_date}|${r.end_date || ''}` === range.id);
    const converted = convertPriceRows(rangeRows);
    contractType = converted.contractType;
    calendars = converted.tariff.calendars || calendars;
    converted.inputs.forEach((input) => {
      if (!inputs.some((i) => i.key === input.key)) {
        inputs.push({ ...input, label: { en: 'Off-peak hours', fr: 'Heures creuses' } });
      }
    });
    const isCurrent = rangeIndex === 0;
    const dates = isCurrent ? null : { from: range.start, ...(range.end ? { to: range.end } : {}) };
    converted.tariff.components.forEach((component) => {
      if (component.kind === 'consumption') {
        const rules = component.rules.map((r) => (dates ? { ...r, when: { ...(r.when || {}), dates } } : r));
        if (isCurrent) {
          energy.rules.push(...rules);
          energy.fallback = component.fallback;
        } else {
          // dated block first (first match wins), its fallback as a dated rule
          energy.rules.unshift(...rules, { ...component.fallback, when: { dates } });
        }
      } else if (isCurrent) {
        fixed.push(component);
      } else {
        fixed.push({ ...component, key: `${component.key}-${range.start}`, when: { dates } });
      }
    });
  });
  const tariff = { tariff_version: 1, components: [energy, ...fixed] };
  if (calendars.length > 0) {
    tariff.calendars = calendars;
  }
  return { tariff, inputs, calendars, contractType };
}

/**
 * @description Convert the v1 catalogue (`{ "<key>": { "<power>": [price rows] } }`) into
 * v2 templates: one template per key and per subscribed power (`variant`), the prices
 * translated with the section 9.2 table, `TO_REPLACE_OFF_PEAK` slots becoming an input.
 * Template keys keep the v1 identifiers so migrated contracts link to them.
 * @param {object} catalogue - The v1 catalogue.
 * @returns {Array<object>} Templates (capability file, section 1) with a `variant` field.
 * @example
 * convertCatalogueV1({ 'edf-base': { '6': [rows] } });
 */
function convertCatalogueV1(catalogue) {
  const templates = [];
  Object.keys(catalogue).forEach((key) => {
    const powers = catalogue[key];
    if (powers === null || typeof powers !== 'object') {
      return;
    }
    Object.keys(powers)
      .filter((power) => Array.isArray(powers[power]) && powers[power].length > 0)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((power) => {
        const rows = powers[power];
        const built = buildVariantTariff(rows);
        const label = `${key} ${power} kVA`;
        templates.push({
          key,
          variant: power,
          name: { en: label, fr: label },
          country: 'FR',
          currency: toIsoCurrency(rows[0].currency),
          timezone: 'Europe/Paris',
          pricing_mode: ENERGY_CONTRACT_PRICING_MODES.RULES,
          version: 'v1',
          contract_type: built.contractType,
          subscribed_power: Number(power) || null,
          power_unit: 'kVA',
          calendars: built.calendars,
          inputs: built.inputs,
          tariff: built.tariff,
        });
      });
  });
  return templates;
}

/**
 * @description Download the community catalogue from the latest GitHub release of
 * `GladysAssistant/energy-contracts`, preferring `contracts-v2.json` (templates in the
 * capability format) and converting `contracts.json` (v1) otherwise. Cached 6 hours.
 * @param {object} [options] - `force` to bypass the cache.
 * @returns {Promise<object>} { templates, calendars, version, format }.
 * @example
 * await getCatalogue();
 */
async function getCatalogue(options = {}) {
  if (!options.force && this.catalogueCache && this.catalogueCache.expires_at > Date.now()) {
    return this.catalogueCache.value;
  }
  const releaseResponse = await axios.get(RELEASE_URL);
  const release = releaseResponse.data;
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const v2 = assets.find((asset) => asset.name === V2_ASSET);
  const v1 = assets.find((asset) => asset.name === V1_ASSET);
  let value;
  if (v2) {
    const { data } = await axios.get(v2.browser_download_url);
    if (!data || typeof data !== 'object' || !Array.isArray(data.templates)) {
      throw new Error(`${V2_ASSET} must contain a templates array`);
    }
    value = {
      templates: data.templates,
      calendars: Array.isArray(data.calendars) ? data.calendars : [],
      version: release.tag_name,
      format: 2,
    };
  } else if (v1) {
    const { data } = await axios.get(v1.browser_download_url);
    if (!data || typeof data !== 'object') {
      throw new Error(`${V1_ASSET} must be a valid JSON object`);
    }
    value = { templates: convertCatalogueV1(data), calendars: [], version: release.tag_name, format: 1, raw: data };
  } else {
    throw new Error(`${V1_ASSET} not found in the latest release`);
  }
  logger.debug(
    `Energy contracts catalogue ${value.version}: ${value.templates.length} templates (format v${value.format})`,
  );
  this.catalogueCache = { expires_at: Date.now() + CATALOGUE_CACHE_TTL_MS, value };
  return value;
}

/**
 * @description The community templates, tagged with their provider.
 * @returns {Promise<Array<object>>} Templates.
 * @example
 * await getCommunityTemplates();
 */
async function getCommunityTemplates() {
  const catalogue = await this.getCatalogue();
  return catalogue.templates.map((template) => ({
    ...template,
    provider: { kind: ENERGY_CONTRACT_PROVIDER_KINDS.COMMUNITY, name: 'energy-contracts', version: catalogue.version },
  }));
}

module.exports = {
  getCatalogue,
  getCommunityTemplates,
  convertCatalogueV1,
  buildVariantTariff,
  CATALOGUE_CACHE_TTL_MS,
};
