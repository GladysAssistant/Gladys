const { expect, assert } = require('chai');
const db = require('../../../models');
const { Cache } = require('../../../utils/cache');
const Session = require('../../../lib/session');

describe('session.getTabletMode', () => {
  const cache = new Cache();
  it('should get tablet mode with has_alarm_code false when alarm_code is null', async () => {
    const session = new Session('secret', cache);
    // Ensure house has no alarm_code
    await db.House.update({ alarm_code: null }, { where: { id: 'a741dfa6-24de-4b46-afc7-370772f068d5' } });
    await session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      true,
      'test-house',
    );
    const oneSession = await session.getTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
    );
    expect(oneSession).to.have.property('tablet_mode', true);
    expect(oneSession).to.have.property('current_house_id', 'a741dfa6-24de-4b46-afc7-370772f068d5');
    expect(oneSession).to.have.property('has_alarm_code', false);
  });
  it('should get tablet mode with has_alarm_code true when alarm_code is set', async () => {
    const session = new Session('secret', cache);
    // Set alarm_code on the house
    await db.House.update({ alarm_code: '1234' }, { where: { id: 'a741dfa6-24de-4b46-afc7-370772f068d5' } });
    await session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      true,
      'test-house',
    );
    const oneSession = await session.getTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
    );
    expect(oneSession).to.have.property('tablet_mode', true);
    expect(oneSession).to.have.property('current_house_id', 'a741dfa6-24de-4b46-afc7-370772f068d5');
    expect(oneSession).to.have.property('has_alarm_code', true);
    // Reset alarm_code
    await db.House.update({ alarm_code: null }, { where: { id: 'a741dfa6-24de-4b46-afc7-370772f068d5' } });
  });
  it('should get tablet mode with has_alarm_code false when no current_house_id', async () => {
    const session = new Session('secret', cache);
    await session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      false,
      null,
    );
    const oneSession = await session.getTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
    );
    expect(oneSession).to.have.property('tablet_mode', false);
    expect(oneSession).to.have.property('current_house_id', null);
    expect(oneSession).to.have.property('has_alarm_code', false);
  });
  it('should return session not found', async () => {
    const session = new Session('secret', cache);
    const promise = session.getTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'eb260700-26d5-49ec-910f-aca90b42f585',
    );
    await assert.isRejected(promise, 'Session not found');
  });
  it('should return tablet mode disabled when there is no local session', async () => {
    const session = new Session('secret', cache);
    const oneSession = await session.getTabletMode('0cd30aef-9c4e-4a23-88e3-3547971296e5', undefined);
    expect(oneSession).to.deep.equal({
      id: null,
      tablet_mode: false,
      current_house_id: null,
      has_alarm_code: false,
    });
  });
});
