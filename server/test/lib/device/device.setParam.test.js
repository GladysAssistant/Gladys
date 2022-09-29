const EventEmitter = require('events');
const { assert } = require('chai');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device', () => {
  it('save test param', async () => {
    const stateManager = new StateManager(event);

    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    let testDevice = await device.get({ search: 'test' });
    await device.setParam(testDevice[0], 'testParamName', 'testParamValue');
    await device.setParam(testDevice[0], 'testParamName2', 'testParamValue2');
    await device.setParam(testDevice[0], 'testParamName', 'testParamValue');
    testDevice = await device.get({ search: testDevice[0].name });
    assert.equal(testDevice[0].params.length, 2);
  });
});
