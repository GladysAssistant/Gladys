const EventEmitter = require('events');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const dgram = {};

const socket = new EventEmitter();
// @ts-ignore
socket.bind = fake.returns(null);
// @ts-ignore
socket.addMembership = fake.returns(null);
// @ts-ignore
socket.send = fake.returns(null);

dgram.createSocket = fake.returns(socket);

module.exports = dgram;

// This mock module is shared by several test files. Its fakes live in this
// file's own sandbox, so the consumers' sinon.reset() cannot clear the call
// history they record — register the sandbox so the global beforeEach clears
// it before every test (the shared sinon singleton used to do this implicitly).
require('../../helpers/sharedMockSandboxes').registerSharedMockSandbox(sinon);
