/**
 * @description Clear every supervision timer of an integration (startup
 * timeout, scheduled restart, stable-running reset).
 * @param {string} serviceId - Id of the external integration service.
 * @example
 * gladys.externalIntegration.clearTimers(service.id);
 */
function clearTimers(serviceId) {
  if (this.startupTimers.has(serviceId)) {
    clearTimeout(this.startupTimers.get(serviceId));
    this.startupTimers.delete(serviceId);
  }
  if (this.restartTimers.has(serviceId)) {
    clearTimeout(this.restartTimers.get(serviceId));
    this.restartTimers.delete(serviceId);
  }
  // sub-container restart timers are keyed `<serviceId>:<name>`
  this.restartTimers.forEach((timer, key) => {
    if (typeof key === 'string' && key.startsWith(`${serviceId}:`)) {
      clearTimeout(timer);
      this.restartTimers.delete(key);
    }
  });
  if (this.stableRunningTimers.has(serviceId)) {
    clearTimeout(this.stableRunningTimers.get(serviceId));
    this.stableRunningTimers.delete(serviceId);
  }
}

module.exports = {
  clearTimers,
};
