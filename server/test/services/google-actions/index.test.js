const GoogleActionsService = require('../../../services/google-actions');

const gladys = {};
const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('GoogleActionsService', () => {
  const googleActionsService = GoogleActionsService(gladys, serviceId);
  it('should start service', async () => {
    await googleActionsService.start();
  });

  it('should stop service', async () => {
    await googleActionsService.stop();
  });
});
