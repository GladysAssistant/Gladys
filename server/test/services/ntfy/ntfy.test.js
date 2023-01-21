const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const workingAxios = {
  axios: {
    default: {
      post: fake.resolves(true),
    },
  },
};

const gladys = {};

describe('NtfyService', () => {
  it('should start service', async () => {
    const NtfyService = proxyquire('../../../services/ntfy/index', workingAxios);
    const ntfyService = NtfyService(gladys, 'f3ef7a64-5997-4e7a-b7ae-2017e8832802');
    await ntfyService.start();
  });
  it('should stop service', async () => {
    const NtfyService = proxyquire('../../../services/ntfy/index', workingAxios);
    const ntfyService = NtfyService(gladys, 'f3ef7a64-5997-4e7a-b7ae-2017e8832802');
    await ntfyService.stop();
  });
  it('should send a notification ', async () => {
    const NtfyService = proxyquire('../../../services/ntfy/index', workingAxios);
    const ntfyService = NtfyService(gladys, 'f3ef7a64-5997-4e7a-b7ae-2017e8832802');
    await ntfyService.start();
    await ntfyService.notification.send('topic', {
      title: 'title',
      message: 'message',
    });
    assert.calledOnce(workingAxios.axios.default.post);
  });
});
