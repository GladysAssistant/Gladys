const { expect } = require('chai');
const sinon = require('sinon');
const { createBridge } = require('../../../../services/homekit/lib/createBridge');

describe('Create bridge', () => {
  const homekitHandler = {
    serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
    createBridge,
    gladys: {
      variable: {
        getValue: sinon.stub().resolves(null),
        setValue: sinon.stub().resolves(),
      },
    },
  };

  it('should create a bridge', async () => {
    const addBridgedAccessories = sinon.stub();
    homekitHandler.hap = {
      Bridge: sinon.stub().returns({
        addBridgedAccessories,
      }),
    };

    await homekitHandler.createBridge([{ UUID: 'd61aa721-9c72-40ae-b7b3-1dbdfd809e58' }]);

    expect(homekitHandler.hap.Bridge.args[0][0]).to.equal('Gladys');
    expect(homekitHandler.hap.Bridge.args[0][1]).not.equal(null);
    expect(addBridgedAccessories.args[0][0]).to.deep.members([{ UUID: 'd61aa721-9c72-40ae-b7b3-1dbdfd809e58' }]);
  });
});
