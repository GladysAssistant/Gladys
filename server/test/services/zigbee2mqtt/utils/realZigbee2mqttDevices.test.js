const { expect } = require('chai');
const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const { convertDevice } = require('../../../../services/zigbee2mqtt/utils/convertDevice');
const payloads = require('./payloads');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};
const serviceId = 'a4c859f0-32d2-46b7-8f5a-3285960f498a';

describe('Decoding real devices', () => {
  payloads.forEach((payload) => {
    const { name, mqttDevice, gladysDevice, values } = payload;

    let service;
    beforeEach(() => {
      service = new Zigbee2mqttManager(gladys, null, null);
      service.discoveredDevices = {
        [name]: mqttDevice,
      };
    });

    it(`[${name}] check Gladys device`, async () => {
      const device = await convertDevice(mqttDevice, serviceId);

      expect(device).to.deep.eq(gladysDevice);
    });

    values.forEach(({ internal, external, property }) => {
      it(`[${name}] read value ${external}`, () => {
        const result = service.readValue(name, property, external);

        expect(result).to.deep.eq(internal);
      });
    });
  });
});
