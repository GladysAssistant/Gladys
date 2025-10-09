const { expect } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const event = new EventEmitter();

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const job = {
  wrapper: (type, func) => {
    return async () => {
      return func();
    };
  },
  updateProgress: fake.resolves({}),
};

describe('gateway.getEdfTempoHistorical', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const system = {
    getInfos: fake.resolves({ gladys_version: 'v4.12.2' }),
  };
  const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);

  it('should return edf tempo historical data with start date and take parameters', async () => {
    const data = await gateway.getEdfTempoHistorical('2025-01-01', 10);

    expect(data).to.be.an('array');
    expect(data).to.have.lengthOf(3);
    expect(data[0]).to.have.property('date', '2025-01-01');
    expect(data[0]).to.have.property('color', 'blue');
    expect(data[1]).to.have.property('date', '2025-01-02');
    expect(data[1]).to.have.property('color', 'white');
    expect(data[2]).to.have.property('date', '2025-01-03');
    expect(data[2]).to.have.property('color', 'red');
  });

  it('should call system.getInfos to get Gladys version', async () => {
    await gateway.getEdfTempoHistorical('2025-01-01', 10);

    expect(system.getInfos.called).to.equal(true);
  });

  it('should work with different start dates', async () => {
    const data = await gateway.getEdfTempoHistorical('2024-12-01', 5);

    expect(data).to.be.an('array');
    expect(data).to.have.lengthOf(3);
  });

  it('should work with different take values', async () => {
    const data = await gateway.getEdfTempoHistorical('2025-01-01', 20);

    expect(data).to.be.an('array');
    expect(data).to.have.lengthOf(3);
  });
});
