const EventEmitter = require('events');
const { expect } = require('chai');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('RemoveControl.getByType', () => {
  it('should return list of remotes', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {});
    const remotes = await deviceManager.remoteControlManager.getByType('television');
    expect(remotes).to.be.instanceOf(Array);
    remotes.forEach((remote) => {
      expect(remote).to.have.property('name');
      expect(remote).to.have.property('selector');
      expect(remote).to.have.property('model', 'remote-control:television');
    });
  });
});
