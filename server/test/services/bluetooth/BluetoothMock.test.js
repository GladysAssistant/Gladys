const { fake } = require('sinon');
const EventEmitter = require('events');

class BluetoothMock extends EventEmitter {}

BluetoothMock.prototype.startScanning = fake.returns(null);

BluetoothMock.prototype.stopScanning = fake.returns(null);
BluetoothMock.prototype.stopScanningAsync = fake.resolves(null);

module.exports = BluetoothMock;
