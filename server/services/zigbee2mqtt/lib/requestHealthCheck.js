// Zigbee2mqtt announces itself online before it listens to its requests: a health check sent right away
// can be lost, so it is sent again until Zigbee2mqtt answers
const HEALTH_CHECK_INTERVAL_IN_MS = 3000;

/**
 * @description Ask Zigbee2mqtt to prove that it runs, every 3 seconds until it answers, as long as Gladys is
 * connected to the broker.
 * @example
 * this.requestHealthCheck();
 */
function requestHealthCheck() {
  clearTimeout(this.healthCheckTimer);
  this.healthCheckTimer = null;
  // Without the broker, the MQTT client would queue the requests and send them all at once on reconnection.
  // On reconnection, Gladys asks again.
  if (!this.mqttClient || !this.gladysConnected) {
    return;
  }
  // Logged, and a failed publication reported, like any other request
  this.publish('zigbee2mqtt/bridge/request/health_check', '{}');
  this.healthCheckTimer = setTimeout(() => this.requestHealthCheck(), HEALTH_CHECK_INTERVAL_IN_MS);
}

module.exports = {
  requestHealthCheck,
};
