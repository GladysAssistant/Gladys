const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const EventEmitter = require('events');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');
const StateManager = require('../../../../lib/state');

chai.use(chaiAsPromised);

const event = new EventEmitter();

describe('scene.play-media', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  afterEach(() => {
    sinon.restore();
  });

  it('should start the media on the player through the music manager', async () => {
    const stateManager = new StateManager(event);
    const device = { music: { play: fake.resolves(null) } };
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.MUSIC.PLAY_MEDIA,
            device: 'kitchen-speaker',
            media: { id: 'spotify:playlist:1', type: 'playlist', title: 'Morning' },
            mode: 'replace',
          },
        ],
      ],
      {},
    );
    assert.calledWith(
      device.music.play,
      'kitchen-speaker',
      { id: 'spotify:playlist:1', type: 'playlist', title: 'Morning' },
      'replace',
    );
  });

  it('should let a failure of the integration surface to the scene framework', async () => {
    const stateManager = new StateManager(event);
    const device = { music: { play: fake.rejects(new Error('EXTERNAL_INTEGRATION_NOT_CONNECTED')) } };
    const promise = executeActions(
      { stateManager, event, device },
      [[{ type: ACTIONS.MUSIC.PLAY_MEDIA, device: 'kitchen-speaker', media: { id: 'x', type: 'track' } }]],
      {},
    );
    await chai.assert.isFulfilled(promise);
    assert.calledOnce(device.music.play);
  });
});
