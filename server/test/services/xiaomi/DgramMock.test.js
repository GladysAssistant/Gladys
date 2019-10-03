const EventEmitter = require('events');
const { fake } = require('sinon');

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
