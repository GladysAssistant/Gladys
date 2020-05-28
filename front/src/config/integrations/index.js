import devices from './devices.json';
import communications from './communications.json';
import calendars from './calendars.json';
import weathers from './weathers.json';
import services from './services.json';

const integrations = [];
const integrationsByType = {};
const categories = [];

const pushAllWithType = (items, type, icon) => {
  integrationsByType[type] = [];
  categories.push({
    type,
    icon
  });

  items.forEach(item => {
    const newItem = { ...item, type };
    integrations.push(newItem);
    integrationsByType[type].push(newItem);
  });
};

pushAllWithType(devices, 'device', 'toggle-right');
pushAllWithType(communications, 'communication', 'message-square');
pushAllWithType(calendars, 'calendar', 'calendar');
pushAllWithType(weathers, 'weather', 'cloud');
pushAllWithType(services, 'service', 'aperture');

export { integrations, integrationsByType, categories };
