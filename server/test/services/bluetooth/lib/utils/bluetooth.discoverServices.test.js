const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const {
  discoverServices,
} = require('../../../../../services/bluetooth/lib/utils/peripheral/bluetooth.discoverServices');
const { NotFoundError } = require('../../../../../utils/coreErrors');

describe('Discover bluetooth services', () => {
  let peripheral;
  let service;
  let services;
  let throwError;
  let discovered;

  beforeEach(() => {
    throwError = false;

    service = { uuid: 'fff0' };
    services = [service];

    discovered = false;

    peripheral = {
      address: 'MAC address',
      discoverServices: (arg, callback) => {
        discovered = true;

        if (throwError) {
          callback('error');
        } else {
          callback(null, services);
        }
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Discover peripheral services with success', async () => {
    const discoveredServices = await discoverServices(peripheral, ['fff0']);

    expect(discoveredServices).deep.eq({ [service.uuid]: service });
    expect(discovered).is.eq(true);
  });

  it('Discover peripheral services with error', async () => {
    throwError = true;

    try {
      await discoverServices(peripheral, ['fff0']);
      assert.fail('Should have fail');
    } catch (e) {
      expect(e).is.instanceOf(Error);
      expect(discovered).is.eq(true);
    }
  });

  it('Discover peripheral services with error (none found)', async () => {
    services = [];

    try {
      await discoverServices(peripheral, ['fff0']);
      assert.fail('Should have fail');
    } catch (e) {
      expect(e).is.instanceOf(NotFoundError);
      expect(discovered).is.eq(true);
    }
  });
});
