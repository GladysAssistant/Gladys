const { expect } = require('chai');
const { assert } = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const XiaomiManager = require('../../../../services/xiaomi/lib');

describe('xiaomiManager commands', () => {
  const zwaveManager = new XiaomiManager(ZwaveMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9cb');
