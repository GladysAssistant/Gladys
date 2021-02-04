const { promisify } = require('util');
const { exec } = require('../../../../utils/childProcess');
const { CONFIGURATION } = require('../constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const containerDescriptor = require('../docker/gladys-rhasspy-container.json');
const logger = require('../../../../utils/logger');
const axios = require('axios');
const { BadParameters } = require('../../../../utils/coreErrors');

const sleep = promisify(setTimeout);

/**
 * @description Get Rhasspy configuration.
 * @returns {Promise} Current RHASSPY network configuration.
 * @example
 * installRhasspyContainer();
 */
async function installRhasspyContainer() {
  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { ancestor: [containerDescriptor.Image] },
  });
  let [container] = dockerContainers;

  if (dockerContainers.length === 0) {
    try {
      logger.info('Zigbee2mqtt is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      logger.info('Creation of container ...');
      const containerLog = await this.gladys.system.createContainer(containerDescriptor);
      logger.trace(containerLog);
      logger.info('Rhasspy successfully installed as Docker container');
    } catch (e) {
      logger.error('Rhasspy failed to install as Docker container', e);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.RHASSPY.STATUS_CHANGE,
      });
      throw new Error('Failed to create container');
    }
  }

  // start container
  try {
    logger.info('Rhasspy is starting...');
    dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerDescriptor.name] },
    });
    [container] = dockerContainers;
    if (container.state !== 'running') {
      await this.gladys.system.restartContainer(container.id);
      // wait 5 seconds for the container to restart
      await sleep(20 * 1000);
    }

    logger.info('Modification of rhasspy profile');
    // Modifier le profile et redemarrer le service
    await axios.post('http://0.0.0.0:12101/api/profile?layers=profile', {
        "intent": {
            "system": "fsticuffs"
        },
        "microphone": {
            "system": "arecord"
        },
        "sounds": {
            "system": "aplay"
        },
        "speech_to_text": {
            "system": "deepspeech"
        },
        "text_to_speech": {
            "nanotts": {
                "language": "en-GB",
                "volume": "1"
            },
            "system": "nanotts"
        },
        "wake": {
            "porcupine": {
                "keyword_path": "jarvis_linux.ppn"
            },
            "system": "porcupine"
        }
    });
    await axios.post('http://0.0.0.0:12101/api/restart');

    await sleep(5 * 1000);

    // await axios.post('http://localhost:12101/api/download-profile');

    await sleep(10 * 1000);

    logger.info('Rhasspy successfully started');
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RHASSPY.STATUS_CHANGE,
    });
    this.rhasspyRunning = true;
  } catch (e) {
    logger.error('Rhasspy container failed to start:', e);
    this.rhasspyRunning = false;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RHASSPY.STATUS_CHANGE,
    });
    throw new Error('Failed to restart container');
  }
}

module.exports = {
  installRhasspyContainer,
};
