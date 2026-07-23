const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHomeHandler = require('../../../../services/melcloud-home/lib');
const { STATUS } = require('../../../../services/melcloud-home/lib/utils/melcloud-home.constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const buildGladys = (existingDevice = null) => ({
  event: { emit: fake.returns(null) },
  stateManager: { get: fake.returns(existingDevice) },
});

describe('MELCloudHomeHandler.discoverDevices', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should throw if not connected', async () => {
    const gladys = buildGladys();
    const handler = new MELCloudHomeHandler(gladys, serviceId, {});
    handler.status = STATUS.NOT_INITIALIZED;

    let error;
    try {
      await handler.discoverDevices();
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(ServiceNotConfiguredError);
    assert.calledOnce(gladys.event.emit);
  });

  it('should discover devices not already in Gladys', async () => {
    const gladys = buildGladys(null);
    const handler = new MELCloudHomeHandler(gladys, serviceId, {});
    handler.status = STATUS.CONNECTED;
    handler.loadDevices = fake.resolves([{ id: 'unit-1', buildingId: 'building-1', givenDisplayName: 'AC' }]);

    const devices = await handler.discoverDevices();

    expect(devices).to.have.lengthOf(1);
    expect(devices[0].external_id).to.equal('melcloud-home:unit-1');
    expect(devices[0].service_id).to.equal(serviceId);
    expect(handler.status).to.equal(STATUS.CONNECTED);
  });

  it('should filter out devices already in Gladys', async () => {
    const gladys = buildGladys({ id: 'already-here' });
    const handler = new MELCloudHomeHandler(gladys, serviceId, {});
    handler.status = STATUS.CONNECTED;
    handler.loadDevices = fake.resolves([{ id: 'unit-1', buildingId: 'building-1' }]);

    const devices = await handler.discoverDevices();

    expect(devices).to.have.lengthOf(0);
  });

  it('should handle a loadDevices error gracefully', async () => {
    const gladys = buildGladys(null);
    const handler = new MELCloudHomeHandler(gladys, serviceId, {});
    handler.status = STATUS.CONNECTED;
    handler.loadDevices = fake.rejects(new Error('boom'));

    const devices = await handler.discoverDevices();

    expect(devices).to.deep.equal([]);
    expect(handler.status).to.equal(STATUS.CONNECTED);
  });
});
