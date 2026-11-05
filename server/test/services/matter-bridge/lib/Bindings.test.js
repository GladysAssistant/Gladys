const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { Bindings, isRemoteChange } = require('../../../../services/matter-bridge/lib/Bindings');
const { buildEndpoints } = require('../../../../services/matter-bridge/lib/buildEndpoints');
const { planDevice } = require('../../../../services/matter-bridge/lib/planDevice');
const { EVENTS, ACTIONS, ACTIONS_STATUS } = require('../../../../utils/constants');
const { createMatter, feature, createContext } = require('../fakes');

const REMOTE = { fabric: 1 };

describe('Matter bridge Bindings', () => {
  let gladys;
  let bindings;
  let clock;
  const matter = createMatter();
  const binary = feature('light-binary', 'light', 'binary');
  const brightness = feature('light-brightness', 'light', 'brightness');
  const level = feature('light-battery', 'battery', 'integer');
  const device = { id: 'light-id', name: 'Light', selector: 'light', features: [binary, brightness, level] };
  let built;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    gladys = { event: { emit: sinon.stub() } };
    bindings = new Bindings(gladys, 100);
    built = buildEndpoints(matter, device, planDevice(device), createContext({ 'light-brightness': 50 }));
    bindings.add(device, built);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should tell remote changes apart', () => {
    expect(isRemoteChange(undefined)).to.equal(false);
    expect(isRemoteChange({ fabric: undefined })).to.equal(false);
    expect(isRemoteChange({ fabric: 2 })).to.equal(true);
  });

  it('should forward a Matter command to Gladys at once', () => {
    built.children[0].state.onOff.onOff = false;
    built.children[0].events.onOff.onOff$Changed.emit(false, true, REMOTE);
    sinon.assert.calledOnceWithExactly(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 0,
      device: 'light',
      device_feature: 'light-binary',
    });
  });

  it('should ignore the changes the bridge makes itself', () => {
    built.children[0].events.onOff.onOff$Changed.emit(true, false, {});
    sinon.assert.notCalled(gladys.event.emit);
  });

  it('should only forward the last of a series of level changes', () => {
    built.children[0].state.levelControl.currentLevel = 100;
    built.children[0].events.levelControl.currentLevel$Changed.emit(100, 50, REMOTE);
    built.children[0].state.levelControl.currentLevel = 254;
    built.children[0].events.levelControl.currentLevel$Changed.emit(254, 100, REMOTE);
    clock.tick(100);
    sinon.assert.calledOnce(gladys.event.emit);
    expect(gladys.event.emit.firstCall.args[1].value).to.equal(100);
  });

  it('should not send a value the listener could not compute', () => {
    bindings.command(device, brightness, null);
    sinon.assert.notCalled(gladys.event.emit);
  });

  it('should skip listeners whose cluster the endpoint does not have', () => {
    const lightOnly = { id: 'x', name: 'X', selector: 'x', features: [feature('x-binary', 'light', 'binary')] };
    const other = buildEndpoints(matter, lightOnly, planDevice(lightOnly), createContext({}));
    delete other.children[0].events.onOff;
    bindings.add(lightOnly, other);
    expect(bindings.cleanups.get('x')).to.have.lengthOf(1);
  });

  it('should push Gladys states to Matter', async () => {
    await bindings.push({ device_feature: 'light-brightness', last_value: 100 });
    expect(built.children[0].state.levelControl.currentLevel).to.equal(254);
    await bindings.push({ device_feature: 'light-battery', last_value: 15 });
    expect(built.root.state.powerSource.batPercentRemaining).to.equal(30);
  });

  it('should not send a state pushed to Matter back to Gladys', async () => {
    await bindings.push({ device_feature: 'light-binary', last_value: 0 });
    await bindings.push({ device_feature: 'light-brightness', last_value: 10 });
    clock.tick(100);
    expect(built.children[0].state.onOff.onOff).to.equal(false);
    sinon.assert.notCalled(gladys.event.emit);
  });

  it('should push the battery to every endpoint carrying it', async () => {
    const alarms = {
      id: 'alarms-id',
      name: 'Alarms',
      selector: 'alarms',
      features: [
        feature('alarms-s1', 'smoke-sensor', 'binary'),
        feature('alarms-s2', 'smoke-sensor', 'binary'),
        feature('alarms-battery', 'battery', 'integer'),
      ],
    };
    const alarmsBuilt = buildEndpoints(matter, alarms, planDevice(alarms), createContext({}));
    bindings.add(alarms, alarmsBuilt);
    await bindings.push({ device_feature: 'alarms-battery', last_value: 15 });
    const [first, second] = alarmsBuilt.children;
    expect(first.state.powerSource.batPercentRemaining).to.equal(30);
    expect(second.state.powerSource.batPercentRemaining).to.equal(30);
    bindings.remove('alarms-id');
    expect(bindings.byFeature.has('alarms-battery')).to.equal(false);
  });

  it('should ignore states of unknown features or without value', async () => {
    const set = sinon.spy(built.children[0], 'set');
    await bindings.push({ device_feature: 'unknown', last_value: 1 });
    await bindings.push({ device_feature: 'light-binary', last_value: null });
    sinon.assert.notCalled(set);
  });

  it('should ignore states the adapter has nothing to forward for', async () => {
    const coverDevice = { id: 'c', name: 'C', selector: 'c', features: [feature('c-state', 'shutter', 'state')] };
    const cover = buildEndpoints(matter, coverDevice, planDevice(coverDevice), createContext({}));
    bindings.add(coverDevice, cover);
    const set = sinon.spy(cover.children[0], 'set');
    await bindings.push({ device_feature: 'c-state', last_value: 1 });
    sinon.assert.notCalled(set);
  });

  it('should survive an endpoint refusing a state', async () => {
    sinon.stub(built.children[0], 'set').rejects(new Error('constraint'));
    await bindings.push({ device_feature: 'light-binary', last_value: 1 });
  });

  it('should forget a device, its listeners and pending commands', () => {
    built.children[0].events.levelControl.currentLevel$Changed.emit(1, 50, REMOTE);
    bindings.remove('light-id');
    clock.tick(100);
    sinon.assert.notCalled(gladys.event.emit);
    expect(bindings.byFeature.size).to.equal(0);
    expect(built.children[0].events.onOff.onOff$Changed.handlers.size).to.equal(0);
    bindings.remove('unknown');
  });

  it('should forget every device', () => {
    bindings.clear();
    expect(bindings.cleanups.size).to.equal(0);
  });

  it('should use the default debounce delay', () => {
    expect(new Bindings(gladys).debounceMs).to.equal(300);
  });
});
