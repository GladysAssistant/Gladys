const { expect } = require('chai');
const { fake, stub } = require('sinon');

const { getTTSApiUrl } = require('../../../lib/tts/tts.getTTSApiUrl');

describe('tts.getTTSApiUrl', () => {
  it('should use gradium when selected and return gradium url', async () => {
    const gradiumGetTTSApiUrl = stub().resolves('http://local/gradium.ogg');
    const gatewayGetTTSApiUrl = fake.resolves({ url: 'http://gateway/file.mp3' });

    const context = {
      service: {
        getService: stub()
          .withArgs('gradium')
          .returns({
            tts: {
              getTTSApiUrl: gradiumGetTTSApiUrl,
            },
          }),
      },
      gateway: {
        getTTSApiUrl: gatewayGetTTSApiUrl,
      },
    };

    const url = await getTTSApiUrl.call(context, {
      service: 'gradium',
      text: 'Bonjour',
    });

    expect(url).to.equal('http://local/gradium.ogg');
    expect(gradiumGetTTSApiUrl.callCount).to.equal(1);
    expect(gradiumGetTTSApiUrl.firstCall.args[0]).to.deep.equal({
      text: 'Bonjour',
    });
    expect(gatewayGetTTSApiUrl.callCount).to.equal(0);
  });

  it('should fallback to gateway when another service is selected', async () => {
    const gradiumGetTTSApiUrl = stub().resolves('http://local/gradium.ogg');
    const gatewayGetTTSApiUrl = fake.resolves({ url: 'http://gateway/file.mp3' });

    const context = {
      service: {
        getService: stub()
          .withArgs('gradium')
          .returns({
            tts: {
              getTTSApiUrl: gradiumGetTTSApiUrl,
            },
          }),
      },
      gateway: {
        getTTSApiUrl: gatewayGetTTSApiUrl,
      },
    };

    const url = await getTTSApiUrl.call(context, {
      service: 'gateway',
      text: 'Bonjour',
    });

    expect(url).to.equal('http://gateway/file.mp3');
    expect(gradiumGetTTSApiUrl.callCount).to.equal(0);
    expect(gatewayGetTTSApiUrl.callCount).to.equal(1);
    expect(gatewayGetTTSApiUrl.firstCall.args[0]).to.deep.equal({
      text: 'Bonjour',
    });
  });
});
