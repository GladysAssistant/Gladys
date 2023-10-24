const { expect } = require('chai');

const MELCloudHandler = require('../../../../services/melcloud/lib/index');
const { STATUS } = require('../../../../services/melcloud/lib/utils/melcloud.constants');

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHandler.disconnect', () => {
  const melcloudHandler = new MELCloudHandler(gladys, serviceId);

  beforeEach(() => {
    melcloudHandler.status = 'UNKNOWN';
  });

  it('should reset attributes', () => {
    melcloudHandler.disconnect();

    expect(melcloudHandler.status).to.eq(STATUS.NOT_INITIALIZED);
    expect(melcloudHandler.contextKey).to.eq(null);
  });
});
