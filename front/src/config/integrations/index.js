import devices from './devices.json';
import communications from './communications.json';
import calendars from './calendars.json';
import weathers from './weathers.json';
import healths from './healths.json';

const integrations = [];
const integrationsByType = {};
const integrationsByKey = {};
const categories = [];

const pushAllWithType = (items, type, icon) => {
  integrationsByType[type] = [];
  categories.push({
    type,
    icon
  });

  items.forEach(item => {
    const newItem = { ...item, type };
    if (!integrationsByKey[item.key]) {
      integrations.push(newItem);
      integrationsByKey[item.key] = newItem;
    }
    integrationsByType[type].push(newItem);
  });
};

pushAllWithType(devices, 'device', 'toggle-right');
pushAllWithType(communications, 'communication', 'message-square');
pushAllWithType(calendars, 'calendar', 'calendar');
pushAllWithType(weathers, 'weather', 'cloud');
pushAllWithType(healths, 'health', 'heart');

export { integrations, integrationsByType, categories };
