const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES, SYSTEM_UPGRADE_ERROR_CODES } = require('../../utils/constants');

// Pinned on purpose: `latest` silently ships flag and behaviour changes to the
// whole installed base, and a broken upgrade path is only noticed once nobody
// can upgrade anymore.
const WATCHTOWER_IMAGE = 'nickfedor/watchtower:1.20.2';

// generous on purpose: pulling a new image over a slow connection on a
// Raspberry Pi is legitimately long, this only bounds how long we watch
const WATCHTOWER_TIMEOUT_IN_MS = 15 * 60 * 1000;

const WATCHTOWER_TIMED_OUT = Symbol('WATCHTOWER_TIMED_OUT');

/**
 * @description Parse a Watchtower log message to extract relevant information and remove Docker stream prefixes.
 * @example
 * parseWatchtowerLog('Dtime="2025-03-31T09:18:17Z" level=info msg="Watchtower 1.7.1"')
 * // Returns: "Starting Watchtower 1.7.1"
 * @param {string} logMessage - The raw log message.
 * @returns {string} Formatted log message.
 */
const parseWatchtowerLog = (logMessage) => {
  try {
    // Extract the actual message content using regex
    const messageMatch = logMessage.match(/msg="([^"]+)"/);
    if (messageMatch) {
      const cleanMessage = messageMatch[1];

      // Skip certain messages that are not useful for the user
      if (
        cleanMessage.includes('Using no notifications') ||
        cleanMessage.includes('Waiting for the notification goroutine to finish')
      ) {
        return null;
      }

      // Format specific messages to be more user-friendly
      if (cleanMessage.includes('Watchtower')) {
        return `Starting Watchtower ${cleanMessage.match(/\d+\.\d+\.\d+/)[0]}`;
      }

      return cleanMessage;
    }

    // If no message content found, try to clean the raw message
    const cleanMessage = logMessage
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/^[DmHh>]\s*/, '') // Remove Docker stream prefixes
      .replace(/time="[^"]+" level=info msg="/, '') // Remove timestamp and level
      .replace(/"$/, ''); // Remove trailing quote

    return cleanMessage;
  } catch (e) {
    // If parsing fails, return the original message
    return logMessage;
  }
};

/**
 * @description Install new upgrade.
 * @example
 * await installUpgrade();
 */
async function installUpgrade() {
  // if the system is not running docker, exit
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const sendUpgradeError = (payload) => {
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SYSTEM.UPGRADE_ERROR,
      payload,
    });
  };

  let gladysImage;
  try {
    gladysImage = await this.getGladysImage();
  } catch (e) {
    logger.warn('Unable to identify the Gladys container, aborting the upgrade', e);
    sendUpgradeError({ code: SYSTEM_UPGRADE_ERROR_CODES.GLADYS_CONTAINER_NOT_FOUND });
    return;
  }

  if (!gladysImage.container_name) {
    logger.warn('The Gladys container has no name, aborting the upgrade');
    sendUpgradeError({ code: SYSTEM_UPGRADE_ERROR_CODES.GLADYS_CONTAINER_NOT_FOUND });
    return;
  }

  // Re-pulling an immutable reference always returns the same image: Watchtower
  // would exit successfully without updating anything. Tell the user instead of
  // running an upgrade that cannot work.
  if (gladysImage.pinned) {
    logger.warn(`Gladys runs on the pinned image ${gladysImage.image}, it cannot be upgraded automatically`);
    sendUpgradeError({
      code: SYSTEM_UPGRADE_ERROR_CODES.IMAGE_TAG_PINNED,
      image: gladysImage.image,
      recommended_image: gladysImage.recommended_image,
    });
    return;
  }

  try {
    logger.info(`Pulling ${WATCHTOWER_IMAGE} image...`);
    await this.pull(WATCHTOWER_IMAGE);

    // Create and start Watchtower container. Passing the Gladys container name
    // restricts the run to Gladys: a manual upgrade must never recreate the
    // other containers running on the user's machine.
    const container = await this.dockerode.createContainer({
      Image: WATCHTOWER_IMAGE,
      name: `gladys-watchtower-${Date.now()}`,
      HostConfig: {
        AutoRemove: true,
        Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
      },
      Cmd: ['--run-once', '--cleanup', '--include-restarting', gladysImage.container_name],
    });

    // Start the container
    await container.start();
    logger.info('Watchtower container started');

    // Stream container logs
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: false,
    });

    // Watchtower announces a pending update before stopping Gladys. Tracking it
    // tells apart "nothing to update" from "the update is on its way".
    let newImageFound = false;

    // Handle log stream
    logStream.on('data', (chunk) => {
      if (chunk) {
        const logMessage = chunk.toString().trim();
        logger.debug('Watchtower log:', logMessage);

        // Split the message into lines and process each line
        const lines = logMessage.split('\n');
        lines.forEach((line) => {
          if (line.trim()) {
            const parsedMessage = parseWatchtowerLog(line);
            if (parsedMessage) {
              // deliberately loose: Watchtower has shipped both `Found new image`
              // and `Found new <reference> image`. Narrowing this match would make
              // a successful pull look like NO_UPDATE_APPLIED after a log reword.
              if (parsedMessage.includes('Found new')) {
                newImageFound = true;
              }
              this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
                type: WEBSOCKET_MESSAGE_TYPES.SYSTEM.WATCHTOWER_LOG,
                payload: { message: parsedMessage },
              });
            }
          }
        });
      }
    });

    // an 'error' event with no listener is an uncaught exception in Node: a
    // Docker socket dropping mid-upgrade would take the whole server down
    logStream.on('error', (streamError) => {
      logger.warn('Watchtower log stream error', streamError);
    });

    // Wait for container to finish. A stalled Watchtower (hanging pull, frozen
    // Docker daemon) would otherwise leave the UI waiting forever, which is the
    // very failure this whole flow exists to avoid.
    let timeoutId;
    const timeout = new Promise((resolve) => {
      timeoutId = setTimeout(() => resolve(WATCHTOWER_TIMED_OUT), WATCHTOWER_TIMEOUT_IN_MS);
    });
    const waitForContainer = container.wait();
    let result;
    try {
      result = await Promise.race([waitForContainer, timeout]);
    } finally {
      clearTimeout(timeoutId);
    }

    if (result === WATCHTOWER_TIMED_OUT) {
      // The abandoned wait can still reject later — a dying Docker daemon is
      // precisely the timeout scenario. Swallow it so it does not surface as an
      // unhandled rejection long after the upgrade was reported failed.
      // eslint-disable-next-line promise/prefer-await-to-then
      waitForContainer.catch((waitError) => {
        logger.warn('Watchtower container wait failed after the timeout', waitError);
      });
      logger.warn(`Watchtower is still running after ${WATCHTOWER_TIMEOUT_IN_MS}ms, giving up on watching it`);
      sendUpgradeError({ code: SYSTEM_UPGRADE_ERROR_CODES.WATCHTOWER_TIMEOUT });
      return;
    }

    const { StatusCode } = result;
    logger.info(`Watchtower container finished with status code ${StatusCode}`);

    if (StatusCode !== 0) {
      sendUpgradeError({ code: SYSTEM_UPGRADE_ERROR_CODES.WATCHTOWER_FAILED, status_code: StatusCode });
      return;
    }

    // Reaching this point while still running means Gladys was not recreated:
    // when the upgrade succeeds, Watchtower stops this container during the run.
    if (!newImageFound) {
      logger.warn(`Watchtower found no new image for ${gladysImage.image}`);
      sendUpgradeError({ code: SYSTEM_UPGRADE_ERROR_CODES.NO_UPDATE_APPLIED, image: gladysImage.image });
    }
  } catch (e) {
    logger.warn('Unable to run the Watchtower upgrade', e);
    sendUpgradeError({ code: SYSTEM_UPGRADE_ERROR_CODES.UNKNOWN_ERROR });
  }
}

module.exports = {
  installUpgrade,
};
