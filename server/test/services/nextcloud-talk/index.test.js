const sinon = require('sinon');
const { expect } = require('chai');

const NextcloudTalkService = require('../../../services/nextcloud-talk');

const gladys = {
  user: {
    getNextcloudTalkTokens: sinon
      .stub()
      .onFirstCall()
      .resolves(['testToken'])
      .onSecondCall()
      .resolves([]),
  },
};

describe('nextcloud-talk', () => {
  const nextcloudTalkService = NextcloudTalkService(gladys, 'a4a59a7d-0001-4958-a794-37e38790142f');
  it('should start service', async () => {
    await nextcloudTalkService.start();
  });
  it('should stop service', async () => {
    await nextcloudTalkService.stop();
  });
  it('should failed start service', async () => {
    await expect(nextcloudTalkService.start()).to.be.rejectedWith(
      Error,
      'No Nextcloud token found. Not starting Nextcloud Talk service',
    );
  });
});
