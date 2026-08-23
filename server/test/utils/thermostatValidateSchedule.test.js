const { expect } = require('chai');

const { validateSchedule } = require('../../utils/thermostatValidateSchedule');

const validSlot = {
  day_of_week: 0,
  start_time: '07:00',
  end_time: '09:00',
  preset: 'comfort',
};

const expectRejected = (payload, fragment) => {
  let error = null;
  try {
    validateSchedule(payload);
  } catch (e) {
    error = e;
  }
  expect(error, `expected ${JSON.stringify(payload)} to be rejected`).to.not.equal(null);
  if (fragment) {
    expect(error.message).to.contain(fragment);
  }
};

describe('thermostatValidateSchedule', () => {
  it('should accept a schedule with valid slots', () => {
    const value = validateSchedule({ name: 'Semaine', slots: [validSlot] });

    expect(value.name).to.equal('Semaine');
    expect(value.slots).to.have.lengthOf(1);
  });

  it('should default an absent slot list to an empty array', () => {
    expect(validateSchedule({ name: 'Semaine' }).slots).to.deep.equal([]);
  });

  it('should require a name', () => {
    expectRejected({ slots: [] }, 'name');
  });

  it('should reject an empty name', () => {
    expectRejected({ name: '', slots: [] }, 'name');
  });

  it('should reject a day outside 0-6', () => {
    expectRejected({ name: 'x', slots: [{ ...validSlot, day_of_week: 7 }] }, 'day_of_week');
    expectRejected({ name: 'x', slots: [{ ...validSlot, day_of_week: -1 }] }, 'day_of_week');
  });

  it('should reject a non-integer day', () => {
    expectRejected({ name: 'x', slots: [{ ...validSlot, day_of_week: 1.5 }] }, 'day_of_week');
  });

  it('should reject a malformed time', () => {
    expectRejected({ name: 'x', slots: [{ ...validSlot, start_time: '7h' }] }, 'start_time');
    expectRejected({ name: 'x', slots: [{ ...validSlot, end_time: '25:00' }] }, 'end_time');
    expectRejected({ name: 'x', slots: [{ ...validSlot, end_time: '09:70' }] }, 'end_time');
  });

  it('should accept the boundary times', () => {
    const value = validateSchedule({
      name: 'x',
      slots: [{ ...validSlot, start_time: '00:00', end_time: '23:59' }],
    });

    expect(value.slots).to.have.lengthOf(1);
  });

  it('should reject an unknown preset', () => {
    expectRejected({ name: 'x', slots: [{ ...validSlot, preset: 'party' }] }, 'preset');
  });

  it('should accept every known preset', () => {
    ['off', 'frost', 'away', 'eco', 'night', 'comfort'].forEach((preset) => {
      expect(validateSchedule({ name: 'x', slots: [{ ...validSlot, preset }] }).slots[0].preset).to.equal(preset);
    });
  });

  it('should accept the row metadata a slot read from the database carries', () => {
    // The editor sends back the slots it was given, ids and timestamps included.
    // Rejecting them would make every edit of an existing schedule fail.
    const stored = {
      ...validSlot,
      id: '5bbaaea4-2ad6-4f3e-9bbc-819b9d310309',
      schedule_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      created_at: '2026-08-23T10:00:00.000Z',
      updated_at: '2026-08-23T10:00:00.000Z',
    };

    expect(validateSchedule({ name: 'Absent', slots: [stored] }).slots).to.have.lengthOf(1);
  });

  it('should still reject an invalid slot that carries row metadata', () => {
    const stored = { ...validSlot, id: '5bbaaea4-2ad6-4f3e-9bbc-819b9d310309' };

    expectRejected({ name: 'x', slots: [{ ...stored, day_of_week: 9 }] }, 'day_of_week');
    expectRejected({ name: 'x', slots: [{ ...stored, preset: 'party' }] }, 'preset');
  });

  it('should reject a missing slot field', () => {
    expectRejected({ name: 'x', slots: [{ day_of_week: 0, start_time: '07:00', end_time: '09:00' }] }, 'preset');
  });

  it('should reject a payload that is not an object', () => {
    expectRejected('nonsense');
  });

  it('should tolerate an undefined payload', () => {
    expectRejected(undefined, 'name');
  });
});
