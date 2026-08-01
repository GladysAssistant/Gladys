const { fake } = require('sinon');
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
