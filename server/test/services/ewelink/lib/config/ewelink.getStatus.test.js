const { expect } = require('chai');

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');

describe('eWeLinkHandler getStatus', () => {
  let eWeLinkHandler;

  beforeEach(() => {
    eWeLinkHandler = new EwelinkHandler({}, null, SERVICE_ID);
  });

  it('should returns default status', () => {
    const status = eWeLinkHandler.getStatus();
    expect(status).deep.eq({ configured: false, connected: false });
  });

  it('should returns overriden status', () => {
    eWeLinkHandler.status = { configured: true, connected: true };

    const status = eWeLinkHandler.getStatus();
    expect(status).deep.eq({ configured: true, connected: true });
  });
});
