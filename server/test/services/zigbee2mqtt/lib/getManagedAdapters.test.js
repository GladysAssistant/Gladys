const { expect } = require('chai');

const { ADAPTERS } = require('../../../../services/zigbee2mqtt/adapters');
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
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getManagedAdapters', () => {
  let manager;

  beforeEach(() => {
    manager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
  });

  it('should get adapters', () => {
    const adapters = manager.getManagedAdapters();
    expect(adapters).deep.eq(ADAPTERS);
  });
});
