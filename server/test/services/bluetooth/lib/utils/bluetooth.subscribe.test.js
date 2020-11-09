const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const { subscribe } = require('../../../../../services/bluetooth/lib/utils/characteristic/bluetooth.subscribe');
const { BadParameters } = require('../../../../../utils/coreErrors');

describe('Subscribe bluetooth peripheral', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('Characteristic no properties', async () => {
    const characteristic = {};
    const onNotify = fake.resolves(null);

    try {
      await subscribe(characteristic, onNotify);
      assert.fail();
    } catch (e) {
      expect(e).is.instanceOf(BadParameters);
      assert.notCalled(onNotify);
    }
  });

  it('Characteristic not "notifiable"', async () => {
    const characteristic = {
      properties: [],
    };
    const onNotify = fake.resolves(null);

    try {
      await subscribe(characteristic, onNotify);
      assert.fail();
    } catch (e) {
      expect(e).is.instanceOf(BadParameters);
      assert.notCalled(onNotify);
    }
  });

  it('Characteristic with "notify"', async () => {
    const characteristic = {
      properties: ['notify'],
      subscribe: fake.yields(null),
      on: fake.yields(null),
    };
    const onNotify = fake.resolves(null);

    await subscribe(characteristic, onNotify);
    assert.calledOnce(characteristic.subscribe);
    assert.calledOnce(characteristic.on);
    assert.calledOnce(onNotify);
  });

  it('Characteristic with "indicate"', async () => {
    const characteristic = {
      properties: ['indicate'],
      subscribe: fake.yields(null),
      on: fake.yields(null),
    };
    const onNotify = fake.resolves(null);

    await subscribe(characteristic, onNotify);
    assert.calledOnce(characteristic.subscribe);
    assert.calledOnce(characteristic.on);
    assert.calledOnce(onNotify);
  });

  it('Characteristic subscribe error', async () => {
    const characteristic = {
      properties: ['indicate'],
      subscribe: fake.yields('error'),
    };
    const onNotify = fake.resolves(null);

    try {
      await subscribe(characteristic, onNotify);
      assert.fail();
    } catch (e) {
      expect(e).is.instanceOf(Error);
      assert.calledOnce(characteristic.subscribe);
      assert.notCalled(onNotify);
    }
  });
});
