const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHomeHandler = require('../../../../services/melcloud-home/lib');
const { EVENTS } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHomeHandler.poll', () => {
  let gladys;
  let handler;

  beforeEach(() => {
    sinon.reset();
    gladys = { event: { emit: fake.returns(null) } };
    handler = new MELCloudHomeHandler(gladys, serviceId, {});
  });

  it('should throw if external_id does not start with melcloud-home', async () => {
    let error;
    try {
      await handler.poll({ external_id: 'melcloud:uuid' });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(BadParameters);
  });

  it('should throw if external_id has no unit id', async () => {
    let error;
    try {
      await handler.poll({ external_id: 'melcloud-home:' });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(BadParameters);
  });

  it('should do nothing if the unit is not found', async () => {
    handler.loadDevices = fake.resolves([{ id: 'other-unit' }]);
    await handler.poll({ external_id: 'melcloud-home:unit-1', features: [] });
    assert.notCalled(gladys.event.emit);
  });

  it('should emit new states only for changed, non-null values', async () => {
    handler.loadDevices = fake.resolves([
      {
        id: 'unit-1',
        settings: [
          { name: 'Power', value: 'True' },
          { name: 'OperationMode', value: 'Cool' },
          { name: 'SetTemperature', value: '21' },
          { name: 'RoomTemperature', value: '23' },
        ],
      },
    ]);

    const device = {
      external_id: 'melcloud-home:unit-1',
      features: [
        { external_id: 'melcloud-home:unit-1:power', last_value: 0 },
        { external_id: 'melcloud-home:unit-1:temperature', last_value: 21 },
        { external_id: 'melcloud-home:unit-1:unknown', last_value: 5 },
      ],
    };

    await handler.poll(device);

    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'melcloud-home:unit-1:power',
      state: 1,
    });
  });
});
