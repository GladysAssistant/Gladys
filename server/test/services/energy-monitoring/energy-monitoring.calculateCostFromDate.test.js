const { assert, fake } = require('sinon');

const EnergyMonitoring = require('../../../services/energy-monitoring/lib');

describe('EnergyMonitoring.calculateCostFromDate', () => {
  let calculateCostFrom;
  let energyMonitoring;

  beforeEach(() => {
    calculateCostFrom = fake.resolves(null);
    const gladys = {
      variable: {
        getValue: fake.resolves('Europe/Paris'),
      },
      job: {
        wrapper: (name, func) => func,
      },
    };
    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    energyMonitoring.calculateCostFrom = calculateCostFrom;
  });

  it('should queue a calculation from local midnight for a date-only string', async () => {
    await energyMonitoring.calculateCostFromDate('2026-07-19');

    assert.calledOnce(calculateCostFrom);
    assert.calledWithExactly(calculateCostFrom, new Date('2026-07-18T22:00:00.000Z'));
  });

  it('should preserve the instant from a complete ISO date', async () => {
    await energyMonitoring.calculateCostFromDate('2026-07-19T00:30:00.000Z');

    assert.calledOnce(calculateCostFrom);
    assert.calledWithExactly(calculateCostFrom, new Date('2026-07-19T00:30:00.000Z'));
  });

  it('should serialize calculations', async () => {
    let releaseFirstCalculation;
    const firstCalculationStarted = new Promise((resolve) => {
      calculateCostFrom.onFirstCall().callsFake(
        () =>
          new Promise((release) => {
            releaseFirstCalculation = release;
            resolve();
          }),
      );
    });

    const firstCalculation = energyMonitoring.calculateCostFromDate('2026-07-19');
    await firstCalculationStarted;
    const secondCalculation = energyMonitoring.calculateCostFromDate('2026-07-20');

    assert.calledOnce(calculateCostFrom);
    releaseFirstCalculation();
    await firstCalculation;
    await secondCalculation;

    assert.calledTwice(calculateCostFrom);
  });
});
