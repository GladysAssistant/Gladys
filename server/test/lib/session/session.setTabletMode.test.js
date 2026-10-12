const { expect, assert } = require('chai');
const db = require('../../../models');
const { Cache } = require('../../../utils/cache');
const Session = require('../../../lib/session');

describe('session.setTabletMode', () => {
  const cache = new Cache();
  it('should set tablet mode to true', async () => {
    const session = new Session('secret', cache);
    await session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      true,
      'test-house',
    );
    const oneSession = await db.Session.findOne({
      where: {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
      },
      raw: true,
    });
    expect(oneSession).to.have.property('tablet_mode', 1);
    expect(oneSession).to.have.property('tablet_mode_locked', 0);
    expect(oneSession).to.have.property('current_house_id', 'a741dfa6-24de-4b46-afc7-370772f068d5');
  });
  it('should set tablet mode to false', async () => {
    const session = new Session('secret', cache);
    await session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      false,
      null,
    );
    const oneSession = await db.Session.findOne({
      where: {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
      },
      raw: true,
    });
    expect(oneSession).to.have.property('tablet_mode', 0);
    expect(oneSession).to.have.property('tablet_mode_locked', 0);
    expect(oneSession).to.have.property('current_house_id', null);
  });
  it('should return session not found', async () => {
    const session = new Session('secret', cache);
    const promise = session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'eb260700-26d5-49ec-910f-aca90b42f585',
      true,
      'test-house',
    );
    await assert.isRejected(promise, 'Session not found');
  });
  it('should return house not found', async () => {
    const session = new Session('secret', cache);
    const promise = session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      true,
      'house not found',
    );
    await assert.isRejected(promise, 'House not found');
  });
  it('should reject when there is no local session', async () => {
    const session = new Session('secret', cache);
    const promise = session.setTabletMode('0cd30aef-9c4e-4a23-88e3-3547971296e5', undefined, true, 'test-house');
    await assert.isRejected(promise, 'Tablet mode requires a local session');
  });
});
