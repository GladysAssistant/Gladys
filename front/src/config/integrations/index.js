import deviceEn from './device.en.json';
import communicationEn from './communication.en.json';
import calendarEn from './calendar.en.json';
import weatherEn from './weather.en.json';
import serviceEn from './service.en.json';

const integrations = {
  en: {
    totalSize: deviceEn.length + communicationEn.length + weatherEn.length + calendarEn.length + serviceEn.length,
    device: deviceEn,
    communication: communicationEn,
    calendar: calendarEn,
    weather: weatherEn,
    service: serviceEn,
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

serviceEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

export default integrations;
