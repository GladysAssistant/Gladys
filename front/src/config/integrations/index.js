import deviceEn from './device.en.json';
import communicationEn from './communication.en.json';
import calendarEn from './calendar.en.json';
import weatherEn from './weather.en.json';

const integrations = {
  en: {
    totalSize: deviceEn.length + communicationEn.length + weatherEn.length + calendarEn.length,
    device: deviceEn,
    communication: communicationEn,
    calendar: calendarEn,
    weather: weatherEn
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

export default integrations;
