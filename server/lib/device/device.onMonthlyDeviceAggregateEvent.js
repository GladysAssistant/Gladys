/**
 * @description It's time to do the monthly device state aggregate
 * @example
 * onMonthlyDeviceAggregateEvent()
 */
async function onMonthlyDeviceAggregateEvent() {
  await this.calculateAggregate('monthly');
}

module.exports = {
  onMonthlyDeviceAggregateEvent,
};
