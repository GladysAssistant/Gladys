const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;
const PiholeService = require('../../../services/pihole/index');

const FakePiholeSummary = require('./piholeSummary.json');

const PiholeController = require('../../../services/pihole/api/pihole.controller');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const piholeHandler = {
  getPiholeSummary: fake.resolves(true),
};

describe('Pihole Service Basics', () => {
  let piholeService;
  beforeEach(() => {
    piholeService = PiholeService();
  });
  it('should have start function', () => {
    expect(piholeService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(piholeService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });

  it('should have controllers', () => {
    expect(piholeService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
});

describe('Pihole Service Start', () => {
  it('should start', async () => {
    const gladys = {
      variable: {
        getValue: fake.returns('127.0.0.1'),
      },
    };
    const piholeService = PiholeService(gladys, '5614b98c-6149-4db4-8ef5-a4c4281a9b7d');
    await piholeService.start();
  });
  it('should faild to start', async () => {
    const gladys = {
      variable: {
        getValue: fake.returns(null),
      },
    };
    const piholeService = PiholeService(gladys, '5614b98c-6149-4db4-8ef5-a4c4281a9b7d');
    try {
      await piholeService.start();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }
  });
});

describe('Pihole Service Stop', () => {
  let piholeService;
  beforeEach(() => {
    piholeService = PiholeService();
  });
  it('should stop service', async () => {
    await piholeService.stop();
  });
});

describe('Pihole Service API', () => {
  const controller = PiholeController(piholeHandler);
  it('get /api/v1/pihole/getPiholeSummary', async () => {
    const req = {};
    const res = {
      json: fake.returns(FakePiholeSummary),
    };
    await controller['get /api/v1/pihole/getPiholeSummary'].controller(req, res);
  });
});
