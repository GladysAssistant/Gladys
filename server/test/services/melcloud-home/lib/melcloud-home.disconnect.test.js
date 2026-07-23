const { expect } = require('chai');

const MELCloudHomeHandler = require('../../../../services/melcloud-home/lib');
const { STATUS } = require('../../../../services/melcloud-home/lib/utils/melcloud-home.constants');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHomeHandler.disconnect', () => {
  it('should reset tokens and status', () => {
    const handler = new MELCloudHomeHandler({}, serviceId, {});
    handler.accessToken = 'token';
    handler.refreshToken = 'refresh';
    handler.tokenExpiresAt = 123;
    handler.status = STATUS.CONNECTED;

    handler.disconnect();

    expect(handler.accessToken).to.equal(null);
    expect(handler.refreshToken).to.equal(null);
    expect(handler.tokenExpiresAt).to.equal(null);
    expect(handler.status).to.equal(STATUS.NOT_INITIALIZED);
  });
});
