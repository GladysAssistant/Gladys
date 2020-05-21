import deviceEn from './device.en.json';
import communicationEn from './communication.en.json';
import calendarEn from './calendar.en.json';
import weatherEn from './weather.en.json';
import healthEn from './health.en.json';

import deviceFr from './device.fr.json';
import communicationFr from './communication.fr.json';
import calendarFr from './calendar.fr.json';
import weatherFr from './weather.fr.json';
import healthFr from './health.fr.json';

const integrations = {
  en: {
    totalSize: deviceEn.length + communicationEn.length + weatherEn.length + calendarEn.length + healthEn.lenght,
    device: deviceEn,
    communication: communicationEn,
    calendar: calendarEn,
    weather: weatherEn,
    health: healthEn
  },
  fr: {
    totalSize: deviceFr.length + communicationFr.length + weatherFr.length + calendarFr.length + healthFr.lenght,
    device: deviceFr,
    communication: communicationFr,
    calendar: calendarFr,
    weather: weatherFr,
    health: healthFr
  }
};

communicationEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

deviceEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

calendarEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

weatherEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

healthEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

export default integrations;
