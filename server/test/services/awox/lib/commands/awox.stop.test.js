const { expect } = require('chai');

const AwoxManager = require('../../../../../services/awox/lib');

describe('awox.stop', () => {
  const bluetooth = {};
  const gladys = {};
  const serviceId = '9811285e-9f26-4af3-a291-3c3e6b9c7e04';
  let manager;

  beforeEach(() => {
    manager = new AwoxManager(gladys, serviceId);
    manager.bluetooth = 'not undefined';
    manager.handlers = { H1: 'not empty' };
  });

  it('should stop manager', async () => {
    manager.bluetooth = bluetooth;

    await manager.stop();

    expect(manager.bluetooth).is.eq(undefined);
    expect(manager.handlers).deep.eq({});
  });
});
