const { expect } = require('chai');

const { isConfigured } = require('../../../../services/zigbee2mqtt/utils/isConfigured');

describe('zigbee2mqtt isConfigured', () => {
  it('should be configured with a USB dongle', () => {
    expect(isConfigured({ z2mDriverPath: '/dev/serial/by-id/usb-dongle', mqttMode: 'local' })).to.equal(true);
  });

  it('should be configured with a network coordinator', () => {
    expect(isConfigured({ z2mNetworkAdapterUrl: 'tcp://192.168.1.20:6638', mqttMode: 'local' })).to.equal(true);
  });

  it('should be configured with an external broker', () => {
    expect(isConfigured({ mqttMode: 'external' })).to.equal(true);
  });

  it('should not be configured without coordinator nor external broker', () => {
    expect(isConfigured({ mqttMode: 'local', mqttPassword: 'password' })).to.equal(false);
  });
});
