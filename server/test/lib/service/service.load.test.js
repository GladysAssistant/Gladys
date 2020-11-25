const { expect } = require('chai');

const Service = require('../../../lib/service');
const StateManager = require('../../../lib/state');
const db = require('../../../models');
const { SERVICE_STATUS } = require('../../../utils/constants');

const services = {
  example: () => ({}),
  'fake-service': undefined,
  'test-service': () => ({}),
  'message-service': () => ({ message: { send: true } }),
};

const gladys = {
  version: '0.1.0',
};

describe('service.load', () => {
  let stateManager;
  let service;

  beforeEach(async () => {
    stateManager = new StateManager();
    service = new Service(services, stateManager);
  });

  it('should load all services', async () => {
    await service.load(gladys);

    const servicesInDb = await db.Service.findAll();

    expect(servicesInDb).lengthOf(4);
    const serviceByName = {};
    servicesInDb.forEach((serviceInDb) => {
      serviceByName[serviceInDb.name] = serviceInDb;
    });

    expect(serviceByName.example.status).eq(SERVICE_STATUS.ENABLED);
    expect(serviceByName.example.has_message_feature).eq(false);

    expect(serviceByName['fake-service'].status).eq(SERVICE_STATUS.DISABLED);
    expect(serviceByName['fake-service'].has_message_feature).eq(false);

    expect(serviceByName['test-service'].status).eq(SERVICE_STATUS.RUNNING);
    expect(serviceByName['test-service'].has_message_feature).eq(false);

    expect(serviceByName['message-service'].status).eq(SERVICE_STATUS.ENABLED);
    expect(serviceByName['message-service'].has_message_feature).eq(true);
  });
});
