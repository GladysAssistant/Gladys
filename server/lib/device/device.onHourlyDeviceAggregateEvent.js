/**
 * @description It's time to do the daily device state aggregate
 * @example
 * onDailyDeviceAggregateEvent()
 */
async function onHourlyDeviceAggregateEvent() {
  await this.calculateAggregate('hourly');
}

module.exports = {
  onHourlyDeviceAggregateEvent,
};
