const { expect } = require('chai');
const { assert: sinonAssert } = require('sinon');

const db = require('../../../models');
const { SERVICE_STATUS, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

describe('externalIntegration.saveStatus', () => {
  it('should persist the status and push it to the frontend', async () => {
    const service = await seedExternalService();
    const { externalIntegration, event } = buildSupervisor();
    await externalIntegration.saveStatus(service, SERVICE_STATUS.DEGRADED);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.DEGRADED);
    sinonAssert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED,
      payload: {
        selector: service.selector,
        status: SERVICE_STATUS.DEGRADED,
      },
    });
  });
});
