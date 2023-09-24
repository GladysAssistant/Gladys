const { expect } = require('chai');

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { STATUS } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.disconnect', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    tuyaHandler.status = 'UNKNOWN';
  });

  it('should reset attributes', () => {
    tuyaHandler.disconnect();

    expect(tuyaHandler.status).to.eq(STATUS.NOT_INITIALIZED);
    expect(tuyaHandler.connector).to.eq(null);
  });
});
