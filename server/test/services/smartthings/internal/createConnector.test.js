const { expect } = require('chai');
const SmartthingsHandler = require('../../../../services/smartthings/lib');

describe('SmartThings service - createConnector', () => {
  const smartthingsHandler = new SmartthingsHandler({}, 'be86c4db-489f-466c-aeea-1e262c4ee720');
  it('should be null at first step', () => {
    expect(smartthingsHandler)
      .to.have.property('connector')
      .and.be.eq(null);
  });
  it('should have created it', () => {
    smartthingsHandler.createConnector('id', 'secret');

    expect(smartthingsHandler)
      .to.have.property('connector')
      .and.not.be.eq(null);
  });
});
