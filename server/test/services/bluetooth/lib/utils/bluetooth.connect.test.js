const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const { BadParameters } = require('../../../../../utils/coreErrors');

const { connect } = require('../../../../../services/bluetooth/lib/utils/peripheral/bluetooth.connect');

describe('Connect bluetooth peripherals', () => {
  let peripheral;
  let throwError;

  beforeEach(() => {
    throwError = false;

    peripheral = {
      uuid: 'uuid',
      connected: false,
      connectable: true,
      addressType: 'public',
      connect(callback) {
        this.connected = true;

        if (throwError) {
          callback(new Error('error'));
        } else {
          callback();
        }
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Connect to peripheral with success', async () => {
    await connect(peripheral);

    expect(peripheral.connected).is.eq(true);
  });

  it('Connect to peripheral with error', async () => {
    throwError = true;

    try {
      await connect(peripheral);
      assert.fail('Connect should have fail');
    } catch (e) {
      expect(e).is.instanceOf(Error);
      expect(peripheral.connected).is.eq(true);
    }
  });

  it('Connect to peripheral with error (not connectable)', async () => {
    peripheral.connectable = false;

    try {
      await connect(peripheral);
      assert.fail('Connect should have fail');
    } catch (e) {
      expect(e).is.instanceOf(BadParameters);
      expect(peripheral.connected).is.eq(false);
    }
  });

  it('Connect to peripheral already connected', async () => {
    peripheral.state = 'connected';

    await connect(peripheral);

    expect(peripheral.connected).is.eq(false);
  });
});
