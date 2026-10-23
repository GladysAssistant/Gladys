const { assert, expect } = require('chai');
const Promise = require('bluebird');
const Gladys = require('../../../../lib');
const db = require('../../../../models');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const { executeActions } = executeActionsFactory(actionsFunc);

describe('scene.setUserLocation', () => {
  let gladys;
  beforeEach(() => {
    gladys = Gladys({ jwtSecret: 'test' });
  });

  it('should persist coordinates, update the user, and preserve area and websocket events without changing house presence', async () => {
    const before = await gladys.user.getBySelector('john');
    await gladys.location.create('john', { latitude: 48, longitude: 11 });
    await gladys.area.create({
      name: 'Destination',
      selector: 'destination',
      latitude: -33.86,
      longitude: 151.21,
      radius: 200,
      color: '#000000',
    });
    const transitions = [];
    const messages = [];
    gladys.event.on(EVENTS.TRIGGERS.CHECK, (data) => transitions.push(data));
    gladys.event.on(EVENTS.WEBSOCKET.SEND_ALL, (data) => messages.push(data));

    await gladys.scene.executeSingleAction({
      type: ACTIONS.USER.SET_LOCATION,
      user: 'john',
      latitude: -33.86,
      longitude: 151.21,
    });

    const saved = await gladys.location.getLast('john');
    expect(saved).to.include({ latitude: -33.86, longitude: 151.21 });
    const user = await gladys.user.getBySelector('john');
    expect(user).to.include({
      last_latitude: -33.86,
      last_longitude: 151.21,
      current_house_id: before.current_house_id,
    });
    expect(user.last_house_changed).to.deep.equal(before.last_house_changed);
    expect(transitions).to.deep.include({ type: EVENTS.AREA.USER_ENTERED, area: 'destination', user: 'john' });
    expect(
      messages.some((message) => message.type === 'location.new' && message.payload.last_longitude === 151.21),
    ).to.equal(true);

    await gladys.scene.executeSingleAction({
      type: ACTIONS.USER.SET_LOCATION,
      user: 'john',
      latitude: -33.86,
      longitude: 151.21,
    });
    const areaExit = new Promise((resolve) => {
      gladys.event.on(EVENTS.TRIGGERS.CHECK, (transition) => {
        if (transition.type === EVENTS.AREA.USER_LEFT && transition.area === 'destination') {
          resolve();
        }
      });
    });
    await gladys.scene.executeSingleAction({
      type: ACTIONS.USER.SET_LOCATION,
      user: 'john',
      latitude: 48,
      longitude: 11,
    });
    await areaExit;
    expect(transitions.filter((transition) => transition.area === 'destination')).to.deep.equal([
      { type: EVENTS.AREA.USER_ENTERED, area: 'destination', user: 'john' },
      { type: EVENTS.AREA.USER_LEFT, area: 'destination', user: 'john' },
    ]);
    const afterExit = await gladys.user.getBySelector('john');
    expect(afterExit.current_house_id).to.equal(before.current_house_id);
    expect(afterExit.last_house_changed).to.deep.equal(before.last_house_changed);
  });

  it('should accept zero, inclusive geographic bounds, trigger variables and earlier-action variables', async () => {
    await Promise.mapSeries(
      [
        [0, -12.5],
        [-90, 180],
        [90, -180],
      ],
      async ([latitude, longitude]) => {
        await gladys.scene.executeSingleAction({ type: ACTIONS.USER.SET_LOCATION, user: 'john', latitude, longitude });
        expect(await gladys.location.getLast('john')).to.include({ latitude, longitude });
      },
    );
    await executeActions(
      gladys.scene,
      [
        [{ type: ACTIONS.VARIABLE.SET, text: '{{triggerEvent.data.latitude}}' }],
        [
          {
            type: ACTIONS.USER.SET_LOCATION,
            user: 'john',
            latitude: '{{0.0.value}}',
            longitude: '{{triggerEvent.data.longitude}}',
          },
        ],
      ],
      { triggerEvent: { data: { latitude: '0', longitude: '-73.9857' } } },
    );
    expect(await gladys.location.getLast('john')).to.include({ latitude: 0, longitude: -73.9857 });
  });

  [
    { user: undefined },
    { latitude: undefined },
    { longitude: null },
    { latitude: '' },
    { longitude: '  ' },
    { latitude: true },
    { latitude: 'NaN' },
    { longitude: 'Infinity' },
    { latitude: 90.01 },
    { latitude: -90.01 },
    { longitude: 180.01 },
    { longitude: -180.01 },
    { longitude: '{{triggerEvent.missing}}' },
    { latitude: '48{{missing}}' },
    { latitude: '{{broken' },
    { latitude: '48,1' },
  ].forEach((invalid, index) => {
    it(`should abort without recording a location or continuing on invalid input ${index + 1}`, async () => {
      const before = await db.Location.count();
      const scope = {};
      await assert.isRejected(
        executeActions(
          gladys.scene,
          [
            [{ type: ACTIONS.USER.SET_LOCATION, user: 'john', latitude: 48.1, longitude: 11.2, ...invalid }],
            [{ type: ACTIONS.VARIABLE.SET, text: 'Must not run' }],
          ],
          scope,
        ),
        AbortScene,
      );
      expect(await db.Location.count()).to.equal(before);
      expect(scope).to.not.have.property('1');
    });
  });
});
