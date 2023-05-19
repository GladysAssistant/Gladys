const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const remote = require('../../../../../../services/broadlink/lib/commands/features/broadlink.remote');
const { NoValuesFoundError } = require('../../../../../../utils/coreErrors');

describe('broadlink.remote', () => {
  const peripheral = {
    sendData: fake.resolves(null),
    mac: [11, 22, 33, 44],
  };

  afterEach(() => {
    sinon.reset();
  });

  describe('buildFeatures', () => {
    it('should have no features', () => {
      const features = remote.buildFeatures();
      expect(features).to.deep.eq([]);
    });
  });

  describe('setValue', () => {
    it('send code without sub value', async () => {
      const device = {
        params: [
          {
            name: 'ir_code_binary',
            value: '0d',
          },
        ],
      };
      const feature = {
        type: 'binary',
      };
      const value = 0;

      await remote.setValue(peripheral, device, feature, value);

      assert.calledOnceWithExactly(peripheral.sendData, Buffer.from([13]));
    });

    it('send code with matching value', async () => {
      const device = {
        params: [
          {
            name: 'ir_code_binary-12',
            value: '0d',
          },
        ],
      };
      const feature = {
        type: 'binary',
      };
      const value = 12;

      await remote.setValue(peripheral, device, feature, value);

      assert.calledOnceWithExactly(peripheral.sendData, Buffer.from([13]));
    });

    it('send code with sub value', async () => {
      const device = {
        params: [
          {
            name: 'ir_code_binary-0',
            value: '0d',
          },
        ],
      };
      const feature = {
        type: 'binary',
      };
      const value = 0;

      await remote.setValue(peripheral, device, feature, value);

      assert.calledOnceWithExactly(peripheral.sendData, Buffer.from([13]));
    });

    it('send multiple codes', async () => {
      const device = {
        params: [
          {
            name: 'ir_code_channel-1',
            value: '0b',
          },
          {
            name: 'ir_code_channel-2',
            value: '0c',
          },
        ],
      };
      const feature = {
        type: 'channel',
      };
      const value = 12;

      await remote.setValue(peripheral, device, feature, value);

      assert.calledTwice(peripheral.sendData);
      assert.calledWith(peripheral.sendData, Buffer.from([11]));
      assert.calledWith(peripheral.sendData, Buffer.from([12]));
    });

    it('missing code', async () => {
      const device = {
        params: [
          {
            name: 'ir_code_channel-1',
            value: '0b',
          },
        ],
      };
      const feature = {
        type: 'channel',
      };
      const value = 12;

      try {
        await remote.setValue(peripheral, device, feature, value);
        expect.fail();
      } catch (e) {
        expect(e).to.be.instanceOf(NoValuesFoundError);
      }

      assert.notCalled(peripheral.sendData);
    });
  });
});
