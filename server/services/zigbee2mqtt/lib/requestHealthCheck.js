// Zigbee2mqtt announces itself online before it listens to its requests: a health check sent right away
// can be lost, so it is sent again until Zigbee2mqtt answers. Quickly at first, for a Zigbee2mqtt that is
// starting, then less and less often, for one stopped or broken for a long time.
const HEALTH_CHECK_FIRST_INTERVAL_IN_MS = 3000;
const HEALTH_CHECK_MAX_INTERVAL_IN_MS = 60000;

/**
 * @description Ask Zigbee2mqtt to prove that it runs, until it answers, as long as Gladys is connected to the
 * broker: again 3 seconds later, then after twice the previous delay each time, up to once a minute.
 * @param {number} [interval] - Delay before the next request.
 * @example
 * this.requestHealthCheck();
 */
function requestHealthCheck(interval = HEALTH_CHECK_FIRST_INTERVAL_IN_MS) {
  clearTimeout(this.healthCheckTimer);
  this.healthCheckTimer = null;
  // Without the broker, the MQTT client would queue the requests and send them all at once on reconnection.
  // On reconnection, Gladys asks again.
  if (!this.mqttClient || !this.gladysConnected) {
    return;
  }
  // Logged, and a failed publication reported, like any other request
  this.publish('zigbee2mqtt/bridge/request/health_check', '{}');
  this.healthCheckTimer = setTimeout(
    () => this.requestHealthCheck(Math.min(interval * 2, HEALTH_CHECK_MAX_INTERVAL_IN_MS)),
    interval,
  );
}

module.exports = {
  requestHealthCheck,
};
