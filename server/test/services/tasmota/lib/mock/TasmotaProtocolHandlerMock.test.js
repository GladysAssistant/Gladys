const { fake } = require('sinon');

const TasmotaHTTPHandlerMock = function TasmotaHTTPHandlerMock() {};

TasmotaHTTPHandlerMock.prototype.connect = fake.returns(null);
TasmotaHTTPHandlerMock.prototype.disconnect = fake.returns(null);
TasmotaHTTPHandlerMock.prototype.scan = fake.returns(null);
TasmotaHTTPHandlerMock.prototype.getValue = fake.returns(null);

module.exports = TasmotaHTTPHandlerMock;
