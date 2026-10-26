const { expect } = require('chai');
const db = require('../../../models');
const { Cache } = require('../../../utils/cache');
const Session = require('../../../lib/session');
const { Error403 } = require('../../../utils/httpErrors');

const SESSION_ID = 'ada07710-5f25-4510-ac63-b002aca3bd32';
const HOUSE_ID = 'a741dfa6-24de-4b46-afc7-370772f068d5';

const setTabletMode = () =>
  db.Session.update({ tablet_mode: true, current_house_id: HOUSE_ID }, { where: { id: SESSION_ID } });

describe('session.init', () => {
  it('should keep a locked tablet restricted to the alarm after a restart', async () => {
    const sessionBeforeRestart = new Session('secret', new Cache());
    // access tokens issued before the tablet is locked
    const { access_token: dashboardToken } = await sessionBeforeRestart.getAccessToken('refresh-token-test', [
      'dashboard:write',
    ]);
    const { access_token: alarmToken } = await sessionBeforeRestart.getAccessToken('refresh-token-test', [
      'alarm:write',
    ]);
    await setTabletMode();
    await sessionBeforeRestart.setTabletModeLocked(HOUSE_ID);
    // a restart empties the RAM cache: the lock is not enforced anymore
    const sessionAfterRestart = new Session('secret', new Cache());
    expect(sessionAfterRestart.validateAccessToken(dashboardToken, 'dashboard:write')).to.have.property(
      'session_id',
      SESSION_ID,
    );
    await sessionAfterRestart.init();
    expect(() => sessionAfterRestart.validateAccessToken(dashboardToken, 'dashboard:write')).to.throw(
      Error403,
      'TABLET_IS_LOCKED',
    );
    // the alarm stays reachable, so the tablet can still be unlocked
    expect(sessionAfterRestart.validateAccessToken(alarmToken, 'alarm:write')).to.have.property(
      'session_id',
      SESSION_ID,
    );
  });
  it('should not load a tablet unlocked before the restart', async () => {
    const sessionBeforeRestart = new Session('secret', new Cache());
    const { access_token: dashboardToken } = await sessionBeforeRestart.getAccessToken('refresh-token-test', [
      'dashboard:write',
    ]);
    await setTabletMode();
    await sessionBeforeRestart.setTabletModeLocked(HOUSE_ID);
    await sessionBeforeRestart.unlockTabletMode(HOUSE_ID);
    const cache = new Cache();
    const sessionAfterRestart = new Session('secret', cache);
    await sessionAfterRestart.init();
    expect(cache.get(`tablet_mode_locked:${SESSION_ID}`)).to.equal(undefined);
    expect(sessionAfterRestart.validateAccessToken(dashboardToken, 'dashboard:write')).to.have.property(
      'session_id',
      SESSION_ID,
    );
  });
  it('should not load a locked tablet whose session is revoked', async () => {
    await db.Session.update(
      { tablet_mode: true, current_house_id: HOUSE_ID, tablet_mode_locked: true, revoked: true },
      { where: { id: SESSION_ID } },
    );
    const cache = new Cache();
    const session = new Session('secret', cache);
    await session.init();
    expect(cache.get(`tablet_mode_locked:${SESSION_ID}`)).to.equal(undefined);
  });
});
