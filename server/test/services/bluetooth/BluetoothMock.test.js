const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const EventEmitter = require('events');

class BluetoothMock extends EventEmitter {
  constructor() {
    super();
    // eslint-disable-next-line no-underscore-dangle
    this._peripherals = {};

    // Fakes are per instance, so calls from another test (or a leaked timer)
    // never pollute the call count checked in the current one.
    this.startScanning = fake.returns(null);
    this.stopScanning = fake.returns(null);
    this.stopScanningAsync = fake.resolves(null);
  }
}

module.exports = BluetoothMock;

// This mock module is shared by several test files. Its fakes live in this
// file's own sandbox, so the consumers' sinon.reset() cannot clear the call
// history they record — register the sandbox so the global beforeEach clears
// it before every test (the shared sinon singleton used to do this implicitly).
require('../../helpers/sharedMockSandboxes').registerSharedMockSandbox(sinon);
