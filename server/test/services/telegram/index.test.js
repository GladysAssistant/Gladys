const TelegramService = require('../../../services/telegram');

const gladys = {
  variable: {
    getValue: () => Promise.resolve('TELEGRAM_API_KEY'),
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
});
