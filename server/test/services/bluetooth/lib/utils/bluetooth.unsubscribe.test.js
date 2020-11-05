const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const { unsubscribe } = require('../../../../../services/bluetooth/lib/utils/characteristic/bluetooth.unsubscribe');
const { BadParameters } = require('../../../../../utils/coreErrors');

describe('Unsubscribe bluetooth peripheral', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('Characteristic no properties', async () => {
    const characteristic = {};

    try {
      await unsubscribe(characteristic);
      assert.fail();
    } catch (e) {
      expect(e).is.instanceOf(BadParameters);
    }
  });

  it('Characteristic not "notifiable"', async () => {
    const characteristic = {
      properties: [],
    };

    try {
      await unsubscribe(characteristic);
      assert.fail();
    } catch (e) {
      expect(e).is.instanceOf(BadParameters);
    }
  });

  it('Characteristic with "notify"', async () => {
    const characteristic = {
      properties: ['notify'],
      unsubscribe: fake.yields(null),
    };

    await unsubscribe(characteristic);
    assert.calledOnce(characteristic.unsubscribe);
  });

  it('Characteristic with "indicate"', async () => {
    const characteristic = {
      properties: ['indicate'],
      unsubscribe: fake.yields(null),
    };

    await unsubscribe(characteristic);
    assert.calledOnce(characteristic.unsubscribe);
  });

  it('Characteristic subscribe error', async () => {
    const characteristic = {
      properties: ['indicate'],
      unsubscribe: fake.yields('error'),
    };

    try {
      await unsubscribe(characteristic);
      assert.fail();
    } catch (e) {
      expect(e).is.instanceOf(Error);
      assert.calledOnce(characteristic.unsubscribe);
    }
  });
});
