const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const MessageHandler = require('../../../../services/telegram/lib');
const TelegramApiMock = require('../TelegramApiMock.test');

const SERVICE_ID = '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4';
const USERS = [{ id: 'a3e07a2a-1f0f-4c00-b5ba-3c1e57b98b40' }, { id: '4d1a2bbb-9e56-4a2a-8f1e-9a91d4a0f0f2' }];

describe('Telegram.message.disable', () => {
  let gladys;
  let messageHandler;

  beforeEach(async () => {
    gladys = {
      variable: {
        destroy: fake.resolves(null),
      },
      user: {
        get: fake.resolves(USERS),
        update: fake.resolves(null),
      },
    };
    messageHandler = new MessageHandler(gladys, TelegramApiMock, SERVICE_ID);
    await messageHandler.connect('test');
    // the mock is shared between test files, we only count the calls of this test
    TelegramApiMock.prototype.stopPolling.resetHistory();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should stop the bot, delete the API key and unlink every user', async () => {
    await messageHandler.disable();

    assert.calledOnce(TelegramApiMock.prototype.stopPolling);
    expect(messageHandler.bot).to.equal(null);
    assert.calledWith(gladys.variable.destroy, 'TELEGRAM_API_KEY', SERVICE_ID);
    assert.calledTwice(gladys.user.update);
    USERS.forEach((user) => {
      assert.calledWith(gladys.user.update, user.id, { telegram_user_id: null });
    });
  });

  it('should be safe to disable twice', async () => {
    await messageHandler.disable();
    await messageHandler.disable();

    // the bot is only stopped once, the second call has nothing to stop
    assert.calledOnce(TelegramApiMock.prototype.stopPolling);
    expect(messageHandler.bot).to.equal(null);
    assert.calledTwice(gladys.variable.destroy);
    assert.callCount(gladys.user.update, USERS.length * 2);
  });

  it('should forward the error when a user cannot be unlinked, and stay retriable', async () => {
    gladys.user.update = fake.rejects(new Error('Unable to update user'));

    await expect(messageHandler.disable()).to.be.rejectedWith(Error);

    // the bot is stopped and the API key is deleted anyway, so running
    // disable again finishes the job
    expect(messageHandler.bot).to.equal(null);
    assert.calledWith(gladys.variable.destroy, 'TELEGRAM_API_KEY', SERVICE_ID);

    gladys.user.update = fake.resolves(null);
    await messageHandler.disable();
    assert.calledTwice(gladys.user.update);
  });
});
