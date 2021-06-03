const { fake, assert } = require('sinon');
const { expect } = require('chai');
const { EVENTS } = require('../../../utils/constants');
const Area = require('../../../lib/area');

describe('area.checkNewLocation', () => {
  it('should check new location of user in area and emit user arrived event', async () => {
    const event = {
      emit: fake.returns(),
      on: fake.returns(),
    };
    const area = new Area(event);
    const previousLocation = {
      latitude: 47.225025738529084,
      longitude: 3.086472190413815,
    };
    const newLocation = {
      latitude: -8.653805936596731,
      longitude: 115.128972530365,
    };
    area.areas = [
      {
        selector: 'my-area',
        latitude: -8.653805936596731,
        longitude: 115.128972530365,
        radius: 50,
      },
    ];
    const res = area.checkNewLocation({ userSelector: 'toto', previousLocation, newLocation });
    expect(res).to.deep.equal({
      areasTheUserIsIn: new Set(['my-area']),
      areasTheUserWasIn: new Set(),
    });
    assert.calledOnce(event.emit);
    assert.calledWith(event.emit, EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.AREA.USER_ENTERED,
      user: 'toto',
      area: 'my-area',
    });
  });
  it('should check new location of user in area and emit user left event', async () => {
    const event = {
      emit: fake.returns(),
      on: fake.returns(),
    };
    const area = new Area(event);
    const previousLocation = {
      latitude: -8.653805936596731,
      longitude: 115.128972530365,
    };
    const newLocation = {
      latitude: 47.225025738529084,
      longitude: 3.086472190413815,
    };
    area.areas = [
      {
        selector: 'my-area',
        latitude: -8.653805936596731,
        longitude: 115.128972530365,
        radius: 50,
      },
    ];
    const res = area.checkNewLocation({ userSelector: 'toto', previousLocation, newLocation });
    expect(res).to.deep.equal({
      areasTheUserIsIn: new Set(),
      areasTheUserWasIn: new Set(['my-area']),
    });
    assert.calledOnce(event.emit);
    assert.calledWith(event.emit, EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.AREA.USER_LEFT,
      user: 'toto',
      area: 'my-area',
    });
  });
});
