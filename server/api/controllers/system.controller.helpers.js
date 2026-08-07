const logger = require('../../utils/logger');

// How long a reboot/shutdown command is given to fail before the request is
// acknowledged: long enough to catch an immediate refusal, short enough not to
// keep the request open until the host actually goes down.
const HOST_POWER_ACK_DELAY_MS = 3000;

/**
 * @description Await a host-power command just long enough to surface an
 * immediate failure, then acknowledge. A failure arriving BEFORE the ack is
 * rethrown (so the API returns an error); a failure arriving AFTER the ack is
 * only logged — the ack already won, so rethrowing would become an unhandled
 * rejection while the host may already be going down.
 * @param {Promise} commandPromise - The reboot/shutdown promise being awaited.
 * @param {string} action - Short label used in logs (e.g. 'reboot host').
 * @param {number} [delayMs] - Ack delay in milliseconds.
 * @returns {Promise} Resolve once acknowledged (or once the command finished first).
 * @example
 * await acknowledgeHostPowerCommand(gladys.system.rebootHost(), 'reboot host');
 */
async function acknowledgeHostPowerCommand(commandPromise, action, delayMs = HOST_POWER_ACK_DELAY_MS) {
  let acknowledged = false;
  const guarded = commandPromise.catch((e) => {
    if (acknowledged) {
      logger.error(`System: ${action} failed after acknowledgement`, e);
      return undefined;
    }
    throw e;
  });
  await Promise.race([
    guarded,
    new Promise((resolve) => {
      setTimeout(() => {
        acknowledged = true;
        resolve();
      }, delayMs);
    }),
  ]);
}

module.exports = {
  acknowledgeHostPowerCommand,
  HOST_POWER_ACK_DELAY_MS,
};
