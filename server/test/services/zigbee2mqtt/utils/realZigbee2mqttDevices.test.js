const { expect } = require('chai');

const { convertDevice } = require('../../../../services/zigbee2mqtt/utils/convertDevice');
const payloads = require('./payloads');

const serviceId = 'a4c859f0-32d2-46b7-8f5a-3285960f498a';

describe('Decoding real devices', () => {
  payloads.forEach((payload) => {
    const { name, mqttDevice, gladysDevice } = payload;

    it(`check Gladys device -> ${name}`, async () => {
      const device = await convertDevice(mqttDevice, serviceId);

      expect(device).to.deep.eq(gladysDevice);
    });
  });
});
