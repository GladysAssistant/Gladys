const { expect } = require('chai');
const sinon = require('sinon');

const LANManager = require('../../../../services/lan-manager/lib');

const gladys = {};
const serviceId = '2f3b1972-63ec-4a9b-b46c-d87611feba69';
const lanDiscovery = {};

describe('LANManager transformDevice', () => {
  let manager;
  let clock;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, lanDiscovery);
    clock = sinon.useFakeTimers({ now: 1483228800000 });
  });

  afterEach(() => {
    clock.restore();
  });

  it('get discovered devices', async () => {
    const device = { ip: 'xxx.xxx.xxx.xxx', mac: 'xx:xx:xx:xx:xx', name: 'device1' };
    const transformedDevice = manager.transformDevice(device);
    expect(transformedDevice).to.deep.equal({
      name: 'device1',
      service_id: serviceId,
      external_id: 'lan-manager:xxxxxxxxxx',
      selector: 'lan-manager-xxxxxxxxxx',
      features: [
        {
          name: 'Presence',
          external_id: 'lan-manager:xxxxxxxxxx:presence-sensor',
          selector: 'lan-manager-xxxxxxxxxx-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          min: 0,
          max: 1,
          read_only: true,
          has_feedback: false,
          keep_history: true,
          last_value: 1,
          last_value_changed: new Date(1483228800000),
        },
      ],
      params: [
        {
          name: 'DEVICE_MAC',
          value: 'xx:xx:xx:xx:xx',
        },
        {
          name: 'DEVICE_NAME',
          value: 'device1',
        },
      ],
    });
  });
});
