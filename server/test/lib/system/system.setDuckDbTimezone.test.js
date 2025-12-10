const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const duckDbSetTimezoneFake = fake.resolves(null);

const dbMock = {
  duckDbSetTimezone: duckDbSetTimezoneFake,
};

const { setDuckDbTimezone } = proxyquire('../../../lib/system/system.setDuckDbTimezone', {
  '../../models': dbMock,
});

const System = proxyquire('../../../lib/system', {
  './system.setDuckDbTimezone': { setDuckDbTimezone },
});

const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.returns(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.setDuckDbTimezone', () => {
  let system;
  let variableMock;

  beforeEach(async () => {
    variableMock = {
      getValue: fake.resolves('Europe/Paris'),
    };
    system = new System(sequelize, event, config, job, variableMock);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should set DuckDB timezone when timezone is available', async () => {
    variableMock.getValue = fake.resolves('Europe/Paris');

    await system.setDuckDbTimezone();

    assert.calledOnce(variableMock.getValue);
    assert.calledWith(variableMock.getValue, SYSTEM_VARIABLE_NAMES.TIMEZONE);
    assert.calledOnce(duckDbSetTimezoneFake);
    assert.calledWith(duckDbSetTimezoneFake, 'Europe/Paris');
  });

  it('should set DuckDB timezone with different timezone', async () => {
    variableMock.getValue = fake.resolves('America/New_York');

    await system.setDuckDbTimezone();

    assert.calledOnce(variableMock.getValue);
    assert.calledWith(variableMock.getValue, SYSTEM_VARIABLE_NAMES.TIMEZONE);
    assert.calledOnce(duckDbSetTimezoneFake);
    assert.calledWith(duckDbSetTimezoneFake, 'America/New_York');
  });

  it('should not set DuckDB timezone when timezone is null', async () => {
    variableMock.getValue = fake.resolves(null);

    await system.setDuckDbTimezone();

    assert.calledOnce(variableMock.getValue);
    assert.calledWith(variableMock.getValue, SYSTEM_VARIABLE_NAMES.TIMEZONE);
    assert.notCalled(duckDbSetTimezoneFake);
  });

  it('should not set DuckDB timezone when timezone is undefined', async () => {
    variableMock.getValue = fake.resolves(undefined);

    await system.setDuckDbTimezone();

    assert.calledOnce(variableMock.getValue);
    assert.calledWith(variableMock.getValue, SYSTEM_VARIABLE_NAMES.TIMEZONE);
    assert.notCalled(duckDbSetTimezoneFake);
  });

  it('should not set DuckDB timezone when timezone is empty string', async () => {
    variableMock.getValue = fake.resolves('');

    await system.setDuckDbTimezone();

    assert.calledOnce(variableMock.getValue);
    assert.calledWith(variableMock.getValue, SYSTEM_VARIABLE_NAMES.TIMEZONE);
    assert.notCalled(duckDbSetTimezoneFake);
  });
});
