const { expect } = require('chai');

const Service = require('../../../lib/service');
const StateManager = require('../../../lib/state');
const db = require('../../../models');
const { SERVICE_STATUS } = require('../../../utils/constants');

const services = {
  example: () => ({}),
  'fake-service': undefined,
  'test-service': () => ({}),
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

    expect(servicesInDb).lengthOf(3);
    const serviceByName = {};
    servicesInDb.forEach((serviceInDb) => {
      serviceByName[serviceInDb.name] = serviceInDb;
    });
    expect(serviceByName.example.status).eq(SERVICE_STATUS.ENABLED);
    expect(serviceByName['fake-service'].status).eq(SERVICE_STATUS.DISABLED);
    expect(serviceByName['test-service'].status).eq(SERVICE_STATUS.READY);
  });
});
