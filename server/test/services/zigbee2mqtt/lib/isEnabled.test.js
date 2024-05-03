const { expect } = require('chai');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};
const mqttLibrary = {};
const serviceId = '625a8a9a-aa9d-474f-8cec-0718dd4ade04';

describe('zigbee2mqtt isEnabled', () => {
  let zigbee2MqttService;
  beforeEach(() => {
    zigbee2MqttService = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
  });

  it('should return false on mqtt not running', () => {
    zigbee2MqttService.mqttRunning = false;
    zigbee2MqttService.zigbee2mqttRunning = true;
    zigbee2MqttService.usbConfigured = true;

    const result = zigbee2MqttService.isEnabled();
    expect(result).to.equal(false);
  });

  it('should return false on z2m not running', () => {
    zigbee2MqttService.mqttRunning = true;
    zigbee2MqttService.zigbee2mqttRunning = false;
    zigbee2MqttService.usbConfigured = true;

    const result = zigbee2MqttService.isEnabled();
    expect(result).to.equal(false);
  });

  it('should return true', () => {
    zigbee2MqttService.mqttRunning = true;
    zigbee2MqttService.zigbee2mqttRunning = true;
    zigbee2MqttService.usbConfigured = true;

    const result = zigbee2MqttService.isEnabled();
    expect(result).to.equal(true);
  });
});
