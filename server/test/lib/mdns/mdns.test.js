const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const Mdns = require('../../../lib/mdns');

describe('mdns', () => {
  let clock;
  let loggerWarnSpy;
  let loggerDebugSpy;
  let state;
  let mdnsFake;
  let variable;
  let event;
  let mdns;

  const getQueryHandler = () => mdnsFake.on.getCalls().find((call) => call.args[0] === 'query').args[1];

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    loggerWarnSpy = sinon.spy(logger, 'warn');
    loggerDebugSpy = sinon.spy(logger, 'debug');
    state = { localIp: '192.168.1.10' };
    mdnsFake = {
      on: fake.returns(null),
      respond: fake((packet, cb) => {
        if (cb) {
          cb();
        }
      }),
      destroy: fake((cb) => {
        if (cb) {
          cb();
        }
      }),
    };
    variable = { getValue: fake.resolves(null) };
    event = { on: fake.returns(null) };
    mdns = new Mdns(variable, event);
    const { getRecords } = proxyquire('../../../lib/mdns/mdns.getRecords', {
      '../system/system.getInfos': { getLocalIp: () => state.localIp },
    });
    const { start } = proxyquire('../../../lib/mdns/mdns.start', {
      'multicast-dns': () => mdnsFake,
    });
    mdns.getRecords = getRecords;
    mdns.start = start;
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should restart advertising when the mDNS hostname variable changes', () => {
    assert.calledWith(event.on, EVENTS.SYSTEM.MDNS_HOSTNAME_CHANGED, sinon.match.func);
  });

  it('should advertise Gladys as gladysassistant.local by default', async () => {
    await mdns.start(1443);
    assert.calledWith(variable.getValue, SYSTEM_VARIABLE_NAMES.MDNS_HOSTNAME);
    expect(mdns.fqdn).to.equal('gladysassistant.local');
    assert.calledOnce(mdnsFake.respond);
    const { answers } = mdnsFake.respond.firstCall.args[0];
    expect(answers.find((record) => record.type === 'A')).to.deep.equal({
      name: 'gladysassistant.local',
      type: 'A',
      ttl: 120,
      flush: true,
      data: '192.168.1.10',
    });
    const srvRecord = answers.find((record) => record.type === 'SRV');
    expect(srvRecord.name).to.equal('Gladys Assistant._http._tcp.local');
    expect(srvRecord.data).to.deep.equal({
      target: 'gladysassistant.local',
      port: 1443,
      priority: 0,
      weight: 0,
    });
    // second unsolicited announcement one second later
    clock.tick(1000);
    assert.calledTwice(mdnsFake.respond);
  });

  it('should answer an A query with only the selected local IP', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ name: 'GladysAssistant.local', type: 'A' }] });
    assert.calledOnce(mdnsFake.respond);
    const { answers, additionals } = mdnsFake.respond.firstCall.args[0];
    expect(answers).to.have.lengthOf(1);
    expect(answers[0]).to.deep.equal({
      name: 'gladysassistant.local',
      type: 'A',
      ttl: 120,
      flush: true,
      data: '192.168.1.10',
    });
    expect(additionals).to.have.lengthOf(0);
  });

  it('should answer a PTR query for HTTP service discovery', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ name: '_http._tcp.local', type: 'PTR' }] });
    assert.calledOnce(mdnsFake.respond);
    const { answers, additionals } = mdnsFake.respond.firstCall.args[0];
    expect(answers).to.have.lengthOf(1);
    expect(answers[0].type).to.equal('PTR');
    expect(answers[0].data).to.equal('Gladys Assistant._http._tcp.local');
    expect(additionals.map((record) => record.type)).to.deep.equal(['SRV', 'TXT', 'A']);
  });

  it('should tag the TXT record so a discovery tool can recognize a Gladys instance', async () => {
    await mdns.start(1443);
    const { answers } = mdnsFake.respond.firstCall.args[0];
    const txtRecord = answers.find((record) => record.type === 'TXT');
    expect(txtRecord.data).to.deep.equal(['product=gladys', 'name=gladysassistant']);
  });

  it('should not answer queries about other names', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ name: 'other-host.local', type: 'A' }] });
    assert.notCalled(mdnsFake.respond);
  });

  it('should advertise a custom hostname from the MDNS_HOSTNAME variable', async () => {
    variable.getValue = fake.resolves('Gladys-Garage.local');
    await mdns.start(1443);
    expect(mdns.fqdn).to.equal('gladys-garage.local');
    expect(mdns.instanceFqdn).to.equal('Gladys Assistant (gladys-garage)._http._tcp.local');
    const { answers } = mdnsFake.respond.firstCall.args[0];
    expect(answers.find((record) => record.type === 'A').name).to.equal('gladys-garage.local');
  });

  it('should fall back to the default hostname when the variable is invalid', async () => {
    variable.getValue = fake.resolves('not a valid hostname!');
    await mdns.start(1443);
    expect(mdns.fqdn).to.equal('gladysassistant.local');
  });

  it('should not advertise anything when no local IP is available', async () => {
    state.localIp = null;
    await mdns.start(1443);
    assert.notCalled(mdnsFake.respond);
    const queryHandler = getQueryHandler();
    queryHandler({ questions: [{ name: 'gladysassistant.local', type: 'A' }] });
    assert.notCalled(mdnsFake.respond);
  });

  it('should stop advertising with mDNS goodbye packets', async () => {
    await mdns.start(1443);
    mdnsFake.respond.resetHistory();
    await mdns.stop();
    assert.calledOnce(mdnsFake.respond);
    const { answers } = mdnsFake.respond.firstCall.args[0];
    expect(answers).to.have.lengthOf(4);
    answers.forEach((record) => {
      expect(record.ttl).to.equal(0);
    });
    assert.calledOnce(mdnsFake.destroy);
    expect(mdns.mdns).to.equal(null);
  });

  it('should do nothing on stop when advertising was not started', async () => {
    await mdns.stop();
    assert.notCalled(mdnsFake.respond);
    assert.notCalled(mdnsFake.destroy);
  });

  it('should re-advertise with the new hostname on restart', async () => {
    await mdns.start(1443);
    variable.getValue = fake.resolves('gladys2');
    await mdns.restart();
    assert.calledOnce(mdnsFake.destroy);
    expect(mdns.fqdn).to.equal('gladys2.local');
    const { answers } = mdnsFake.respond.lastCall.args[0];
    expect(answers.find((record) => record.type === 'A').name).to.equal('gladys2.local');
  });

  it('should answer an ANY query about the Gladys hostname', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ name: 'gladysassistant.local', type: 'ANY' }] });
    assert.calledOnce(mdnsFake.respond);
    const { answers } = mdnsFake.respond.firstCall.args[0];
    expect(answers[0].type).to.equal('A');
  });

  it('should answer an ANY query for HTTP service discovery', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ name: '_http._tcp.local', type: 'ANY' }] });
    assert.calledOnce(mdnsFake.respond);
    const { answers } = mdnsFake.respond.firstCall.args[0];
    expect(answers[0].type).to.equal('PTR');
  });

  it('should answer a SRV query about the Gladys service instance', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ name: 'Gladys Assistant._http._tcp.local', type: 'SRV' }] });
    assert.calledOnce(mdnsFake.respond);
    const { answers, additionals } = mdnsFake.respond.firstCall.args[0];
    expect(answers).to.have.lengthOf(1);
    expect(answers[0].type).to.equal('SRV');
    expect(answers[0].data.port).to.equal(1443);
    // the A record is sent along so the client does not need a second query
    expect(additionals.map((record) => record.type)).to.deep.equal(['A']);
  });

  it('should answer a TXT query about the Gladys service instance', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ name: 'Gladys Assistant._http._tcp.local', type: 'TXT' }] });
    assert.calledOnce(mdnsFake.respond);
    const { answers, additionals } = mdnsFake.respond.firstCall.args[0];
    expect(answers).to.have.lengthOf(1);
    expect(answers[0].data).to.deep.equal(['product=gladys', 'name=gladysassistant']);
    expect(additionals).to.have.lengthOf(0);
  });

  it('should answer an ANY query about the Gladys service instance with SRV and TXT', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ name: 'Gladys Assistant._http._tcp.local', type: 'ANY' }] });
    assert.calledOnce(mdnsFake.respond);
    const { answers, additionals } = mdnsFake.respond.firstCall.args[0];
    // DNS-SD clients asking ANY expect TXT next to SRV
    expect(answers.map((record) => record.type)).to.deep.equal(['SRV', 'TXT']);
    expect(additionals.map((record) => record.type)).to.deep.equal(['A']);
  });

  it('should handle a query packet without any question', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({});
    assert.notCalled(mdnsFake.respond);
  });

  it('should handle a question without any name', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ type: 'A' }] });
    assert.notCalled(mdnsFake.respond);
  });

  it('should not answer queries once advertising is stopped', async () => {
    await mdns.start(1443);
    const queryHandler = getQueryHandler();
    await mdns.stop();
    mdnsFake.respond.resetHistory();
    queryHandler({ questions: [{ name: 'gladysassistant.local', type: 'A' }] });
    assert.notCalled(mdnsFake.respond);
  });

  it('should not crash when a query cannot be handled', async () => {
    await mdns.start(1443);
    mdns.getRecords = fake.throws(new Error('unable to build records'));
    const queryHandler = getQueryHandler();
    mdnsFake.respond.resetHistory();
    expect(() => queryHandler({ questions: [{ name: 'gladysassistant.local', type: 'A' }] })).to.not.throw();
    assert.notCalled(mdnsFake.respond);
  });

  it('should log network errors without crashing Gladys', async () => {
    await mdns.start(1443);
    const errorHandler = mdnsFake.on.getCalls().find((call) => call.args[0] === 'error').args[1];
    const warningHandler = mdnsFake.on.getCalls().find((call) => call.args[0] === 'warning').args[1];
    const networkError = new Error('EADDRINUSE');
    const networkWarning = new Error('malformed packet');
    errorHandler(networkError);
    warningHandler(networkWarning);
    assert.calledWith(loggerWarnSpy, 'mDNS: network error while advertising Gladys');
    assert.calledWith(loggerWarnSpy, networkError);
    assert.calledWith(loggerDebugSpy, 'mDNS: warning while advertising Gladys');
    assert.calledWith(loggerDebugSpy, networkWarning);
  });

  it('should not crash when the mDNS socket cannot be created', async () => {
    const { start: failingStart } = proxyquire('../../../lib/mdns/mdns.start', {
      'multicast-dns': () => {
        throw new Error('unable to bind the mDNS socket');
      },
    });
    mdns.start = failingStart;
    await mdns.start(1443);
    expect(mdns.mdns).to.equal(null);
    // Gladys stays up, only the advertisement is unavailable
    await mdns.stop();
  });

  it('should not crash when the goodbye packets cannot be sent', async () => {
    await mdns.start(1443);
    mdnsFake.respond = fake.throws(new Error('socket already closed'));
    await mdns.stop();
    expect(mdns.mdns).to.equal(null);
  });

  it('should cancel the second announcement when stopped right away', async () => {
    await mdns.start(1443);
    await mdns.stop();
    mdnsFake.respond.resetHistory();
    clock.tick(1000);
    assert.notCalled(mdnsFake.respond);
  });

  it('should destroy the mDNS socket even when the goodbye packets fail', async () => {
    await mdns.start(1443);
    mdnsFake.respond = fake.throws(new Error('socket already closed'));
    await mdns.stop();
    // the socket must be closed anyway, otherwise a restart leaves a second advertiser
    assert.calledOnce(mdnsFake.destroy);
    expect(mdns.mdns).to.equal(null);
  });

  it('should destroy the mDNS socket even when the records cannot be built', async () => {
    await mdns.start(1443);
    mdns.getRecords = fake.throws(new Error('unable to build records'));
    await mdns.stop();
    assert.calledOnce(mdnsFake.destroy);
  });

  it('should not crash when the mDNS socket cannot be destroyed', async () => {
    await mdns.start(1443);
    mdnsFake.destroy = fake.throws(new Error('socket already gone'));
    await mdns.stop();
    expect(mdns.mdns).to.equal(null);
  });

  it('should not send goodbye packets when no local IP is available', async () => {
    await mdns.start(1443);
    state.localIp = null;
    mdnsFake.respond.resetHistory();
    await mdns.stop();
    assert.notCalled(mdnsFake.respond);
    assert.calledOnce(mdnsFake.destroy);
  });

  it('should not crash when the delayed announcement fails', async () => {
    await mdns.start(1443);
    mdns.getRecords = fake.throws(new Error('network went down'));
    // an exception escaping a timer callback would take the whole process down
    expect(() => clock.tick(1000)).to.not.throw();
    assert.calledWith(loggerWarnSpy, 'mDNS: unable to send the second announcement');
  });

  it('should serialize concurrent restarts', async () => {
    await mdns.start(1443);
    mdnsFake.destroy.resetHistory();
    // hold the first stop() open so the second restart starts while it is still pending
    let releaseDestroy;
    mdnsFake.destroy = fake((cb) => {
      releaseDestroy = () => cb();
    });
    const firstRestart = mdns.restart();
    const secondRestart = mdns.restart();
    // let stop() reach destroy() before releasing it
    await Promise.resolve();
    await Promise.resolve();
    releaseDestroy();
    await Promise.all([firstRestart, secondRestart]);
    // both events must lead to a single advertiser, not two
    assert.calledOnce(mdnsFake.destroy);
    // one start() for the initial advertisement, one for the single coalesced restart
    expect(variable.getValue.callCount).to.equal(2);
  });

  it('should do nothing on restart when advertising was never started', async () => {
    await mdns.restart();
    assert.notCalled(variable.getValue);
    assert.notCalled(mdnsFake.destroy);
  });
});
