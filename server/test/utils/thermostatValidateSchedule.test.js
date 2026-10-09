const { expect } = require('chai');

const { validateSchedule } = require('../../utils/thermostatValidateSchedule');

const validTransition = {
  day_of_week: 0,
  time: '07:00',
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
  it('should accept a schedule with valid transitions', () => {
    const value = validateSchedule({ name: 'Semaine', transitions: [validTransition] });

    expect(value.name).to.equal('Semaine');
    expect(value.transitions).to.have.lengthOf(1);
    expect(value.transitions[0].preset).to.equal('comfort');
  });

  it('should default transitions to an empty array', () => {
    const value = validateSchedule({ name: 'Semaine' });

    expect(value.transitions).to.deep.equal([]);
  });

  it('should accept off, which stops the heating on that point', () => {
    const value = validateSchedule({ name: 'Semaine', transitions: [{ ...validTransition, preset: 'off' }] });

    expect(value.transitions[0].preset).to.equal('off');
  });

  it('should keep the row metadata a transition read from the database carries', () => {
    const value = validateSchedule({
      name: 'Semaine',
      transitions: [{ ...validTransition, id: 'aa6a6b1a-0f1c-4b1e-9d3f-9f8e7d6c5b4a' }],
    });

    expect(value.transitions[0].id).to.equal('aa6a6b1a-0f1c-4b1e-9d3f-9f8e7d6c5b4a');
  });

  it('should reject an empty name', () => {
    expectRejected({ name: '', transitions: [] });
  });

  it('should reject a missing name', () => {
    expectRejected({ transitions: [] });
  });

  it('should reject an undefined payload', () => {
    expectRejected(undefined);
  });

  it('should reject a day outside 0-6', () => {
    expectRejected({ name: 'Semaine', transitions: [{ ...validTransition, day_of_week: 7 }] });
    expectRejected({ name: 'Semaine', transitions: [{ ...validTransition, day_of_week: -1 }] });
  });

  it('should reject a non-integer day', () => {
    expectRejected({ name: 'Semaine', transitions: [{ ...validTransition, day_of_week: 1.5 }] });
  });

  it('should reject a malformed time', () => {
    expectRejected({ name: 'Semaine', transitions: [{ ...validTransition, time: '7:00' }] });
    expectRejected({ name: 'Semaine', transitions: [{ ...validTransition, time: '24:00' }] });
    expectRejected({ name: 'Semaine', transitions: [{ ...validTransition, time: '07:60' }] });
  });

  it('should reject a missing time', () => {
    expectRejected({ name: 'Semaine', transitions: [{ day_of_week: 0, preset: 'comfort' }] });
  });

  it('should reject an unknown preset', () => {
    expectRejected({ name: 'Semaine', transitions: [{ ...validTransition, preset: 'party' }] });
  });

  it('should reject schedule as a transition preset, the programme referring to itself', () => {
    expectRejected({ name: 'Semaine', transitions: [{ ...validTransition, preset: 'schedule' }] });
  });

  it('should reject two transitions on the same day at the same time', () => {
    expectRejected(
      {
        name: 'Semaine',
        transitions: [validTransition, { ...validTransition, preset: 'eco' }],
      },
      'duplicate transition on day 0 at 07:00',
    );
  });

  it('should accept the same time on two different days', () => {
    const value = validateSchedule({
      name: 'Semaine',
      transitions: [validTransition, { ...validTransition, day_of_week: 1 }],
    });

    expect(value.transitions).to.have.lengthOf(2);
  });
});
