import { INTEGRATION_CATALOG_CATEGORIES } from '../../../../server/utils/constants';
import devices from './devices.json';
import communications from './communications.json';
import calendars from './calendars.json';
import weathers from './weathers.json';
import ttsProviders from './tts.json';

// Browse categories of the catalog (docs/specs/integration-catalog-
// categories.md): the keys and their order come from the server constants
// (single source of truth of the controlled vocabulary), only the icons are
// display concerns of the front
const CATEGORY_ICONS = {
  climate: 'thermometer',
  lighting: 'zap',
  energy: 'battery-charging',
  security: 'shield',
  multimedia: 'speaker',
  appliances: 'coffee',
  environment: 'cloud',
  protocols: 'radio',
  network: 'wifi',
  notifications: 'message-square',
  assistants: 'mic',
  services: 'calendar'
};

const catalogCategories = INTEGRATION_CATALOG_CATEGORIES.map(key => ({
  key,
  icon: CATEGORY_ICONS[key] || 'grid'
}));

const integrations = [];
// `type` stays a purely technical key (routing, screens, role visibility):
// the per-type files keep encoding it, the browse categories of each entry
// are independent display metadata
const pushAllWithType = (items, type) => {
  items.forEach(item => {
    integrations.push({ ...item, type });
  });
};

pushAllWithType(devices, 'device');
pushAllWithType(communications, 'communication');
pushAllWithType(calendars, 'calendar');
pushAllWithType(weathers, 'weather');
// no internal TTS integration: the "tts" type is only carried by external
// TTS provider integrations installed from the store
pushAllWithType(ttsProviders, 'tts');

export { integrations, catalogCategories };
