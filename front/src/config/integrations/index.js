import deviceEn from './device.en.json';
import communicationEn from './communication.en.json';
import weatherEn from './weather.en.json';
import thirdPartyEn from './third-party.en.json';

const integrations = {
  en: {
    totalSize: deviceEn.length + communicationEn.length + weatherEn.length + thirdPartyEn.length,
    device: deviceEn,
    communication: communicationEn,
    weather: weatherEn,
    'third-party': thirdPartyEn
  }
};

communicationEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

deviceEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

weatherEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

thirdPartyEn.forEach(integration => {
  integrations.en[integration.key] = integration;
});

export default integrations;
