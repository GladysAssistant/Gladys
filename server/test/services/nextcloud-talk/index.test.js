const NextcloudTalkService = require('../../../services/nextcloud-talk');

const gladys = {
  user: {
    getNextcloudTalkTokens: () => Promise.resolve(['testToken']),
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
});
