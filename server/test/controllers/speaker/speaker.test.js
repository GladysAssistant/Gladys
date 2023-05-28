const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');
const { EVENTS } = require('../../../utils/constants');

describe('GET /api/v1/speaker/:speaker_output_name/status', () => {
  it('should get speaker status, result is empty', async () => {
    await authenticatedRequest
      .get('/api/v1/speaker/default/status')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.empty; // eslint-disable-line
      });
  });
});

describe('GET /api/v1/speaker/:speaker_output_name/status', () => {
  before(async () => {
    const soundControl = {
      volumeLevel: 0.8,
      path: 'fake-path',
      soundRequest: {
        eventType: EVENTS.MUSIC.PLAY,
        random: false,
        provider: 'test-provider',
      },
      writer: {
        _writableState: {
          // eslint-disable-line no-underscore-dangle
          finished: false,
        },
      },
    };
    global.TEST_GLADYS_INSTANCE.speaker.mapOfStreamControl.set('default', soundControl);
  });
  after(async () => {
    global.TEST_GLADYS_INSTANCE.speaker.mapOfStreamControl.delete('default');
  });

  it('should get speaker status, result is not empty', async () => {
    await authenticatedRequest
      .get('/api/v1/speaker/default/status')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body.volumeLevel).to.be.equals(0.8);
        expect(res.body.path).to.be.equals('fake-path');
        expect(res.body.provider).to.be.equals('test-provider');
        expect(res.body.play).to.be.equals(true);
        expect(res.body.random).to.be.equals(false);
      });
  });
});
