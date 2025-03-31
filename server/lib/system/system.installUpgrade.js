const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

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

      if (cleanMessage.includes('Session done')) {
        const matches = cleanMessage.match(/Failed=(\d+) Scanned=(\d+) Updated=(\d+)/);
        if (matches) {
          const [, failed, scanned, updated] = matches;
          return `Update completed: ${scanned} container(s) scanned, ${updated} updated, ${failed} failed`;
        }
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

  const watchtowerImage = 'containrrr/watchtower';

  logger.info(`Pulling ${watchtowerImage} image...`);
  await this.pull(watchtowerImage);

  // Create and start Watchtower container
  const container = await this.dockerode.createContainer({
    Image: watchtowerImage,
    name: `gladys-watchtower-${Date.now()}`,
    HostConfig: {
      AutoRemove: true,
      Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
    },
    Cmd: ['--run-once', '--cleanup', '--include-restarting'],
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

  // Handle log stream
  logStream.on('data', (chunk) => {
    const logMessage = chunk.toString().trim();
    if (logMessage) {
      logger.debug('Watchtower log:', logMessage);

      // Split the message into lines and process each line
      const lines = logMessage.split('\n');
      lines.forEach((line) => {
        if (line.trim()) {
          const parsedMessage = parseWatchtowerLog(line);
          if (parsedMessage) {
            this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
              type: WEBSOCKET_MESSAGE_TYPES.SYSTEM.WATCHTOWER_LOG,
              payload: { message: parsedMessage },
            });
          }
        }
      });
    }
  });

  // Wait for container to finish
  const { StatusCode } = await container.wait();
  logger.info(`Watchtower container finished with status code ${StatusCode}`);

  if (StatusCode !== 0) {
    throw new Error(`Watchtower container exited with status code ${StatusCode}`);
  }
}

module.exports = {
  installUpgrade,
};
