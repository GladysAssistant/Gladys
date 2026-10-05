import { DYNAMIC_SOURCES } from '../../../../server/lib/external-integration/constants';

// The options of the select/multi_select fields whose `source` is a
// core-defined dynamic source, shared by every screen rendering the manifest
// field grammar (Configuration screen, action mini forms, widget settings,
// scene triggers and actions). Both come from standard routes every
// authenticated user can read.
const SOURCE_LOADERS = {
  // the already-created devices of the integration (label = device name,
  // value = external_id), naturally scoped to its t_service
  devices: async (httpClient, integrationSelector) => {
    const devices = await httpClient.get(`/api/v1/service/${encodeURIComponent(integrationSelector)}/device`);
    return devices.map(device => ({ value: device.external_id, label: device.name }));
  },
  // the houses of Gladys (label = house name, value = selector, the
  // identifier GET /house returns to the integration)
  houses: async httpClient => {
    const houses = await httpClient.get('/api/v1/house');
    return houses.map(house => ({ value: house.selector, label: house.name }));
  }
};

const getDynamicSources = fields => [
  ...new Set((fields || []).map(field => field.source).filter(source => DYNAMIC_SOURCES.includes(source)))
];

// true when at least one field takes its options from a dynamic source
const hasDynamicSource = fields => getDynamicSources(fields).length > 0;

// Load the options of every dynamic source the fields declare, each source
// once: resolves with the options by source, ex: { houses: [{ value, label }] }
const fetchDynamicOptions = async (httpClient, integrationSelector, fields) => {
  const sources = getDynamicSources(fields);
  const options = await Promise.all(sources.map(source => SOURCE_LOADERS[source](httpClient, integrationSelector)));
  const dynamicOptions = {};
  sources.forEach((source, index) => {
    dynamicOptions[source] = options[index];
  });
  return dynamicOptions;
};

export { hasDynamicSource, fetchDynamicOptions };
