const { expect } = require('chai');
const sinon = require('sinon');

const SmartthingsHandler = require('../../../../services/smartthings/lib');

const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';
const gladys = {};

describe('SmartThings service - loadCallbackInformation', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('first is empty', () => {
    expect(smartthingsHandler.callbackUsers).to.deep.eq({});
  });

  it('then fulfilled', async () => {
    await smartthingsHandler.loadCallbackInformation();

    expect(smartthingsHandler.callbackUsers).to.have.keys([
      '7a137a56-069e-4996-8816-36558174b727',
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    ]);
  });
});
