/**
 * @description It's time to do the daily device state aggregate
 * @example
 * onDailyDeviceAggregateEvent()
 */
async function onDailyDeviceAggregateEvent() {
  await this.calculateAggregate('monthly');
  await this.calculateAggregate('daily');
}

module.exports = {
  onDailyDeviceAggregateEvent,
};
