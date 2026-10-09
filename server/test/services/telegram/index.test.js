const { expect } = require('chai');

const TelegramService = require('../../../services/telegram');

const gladys = {
  variable: {
    getValue: () => Promise.resolve('TELEGRAM_API_KEY'),
  },
};

const gladysNotConfigured = {
  variable: {
    getValue: () => Promise.resolve(null),
  },
};

describe('telegram', () => {
  const telegramService = TelegramService(gladys, 'f87b7af2-ca8e-44fc-b754-444354b42fee');
  it('should start service', async () => {
    await telegramService.start();
  });
  it('should stop service', async () => {
    await telegramService.stop();
  });
  it('should be used when an API token is configured', async () => {
    expect(await telegramService.isUsed()).to.equal(true);
  });
  it('should not be used when no API token is configured', async () => {
    // the service stays loaded and RUNNING when start() throws a
    // ServiceNotConfiguredError, so isUsed() is what tells the message
    // channel selector that Telegram must not be offered
    const notConfigured = TelegramService(gladysNotConfigured, 'f87b7af2-ca8e-44fc-b754-444354b42fee');
    expect(await notConfigured.isUsed()).to.equal(false);
  });
});
