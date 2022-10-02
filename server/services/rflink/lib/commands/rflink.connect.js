const os = require('os');
const Serialport = require('serialport');
const Readline = require('@serialport/parser-readline');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

/**
 * @description Connect to Rflink
 * @param {string} path - Path to the Rflink gateway.
 * @returns {string} Status.
 * @example
 * rflink.connect(path);
 */
function connect(path) {
  this.connected = false;
  this.ready = false;
  this.scanInProgress = false;

  if (!path) {
    throw new ServiceNotConfiguredError('RFLINK_PATH_NOT_FOUND');
  }
  // special case for macOS
  if (os.platform() === 'darwin') {
    this.path = path.replace('/dev/tty.', '/dev/cu.');
  } else {
    this.path = path;
  }

  try {
    const port = new Serialport(this.path, {
      baudRate: 57600,
      dataBits: 8,
      parity: 'none',
      autoOpen: false,
    });
    this.sendUsb = port;

    this.sendUsb.open(function returnOpenErr(err) {
      if (err) {
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_FAILED,
        });
        return logger.error(`Error opening port: : ${err.message}`);
      }
      return logger.info(`Success on opening port`);
    });

    const readline = new Readline({
      baudRate: 57600,
    });
    this.sendUsb.pipe(readline);
    this.usb = readline;

    logger.debug(`Rflink : Connecting to USB = ${path}`);
    this.connected = true;
    this.ready = true;
    this.scanInProgress = true;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_READY,
    });
    this.listen();
  } catch (error) {
    this.connected = false;
    this.ready = false;
    this.scanInProgress = false;
  }
}

module.exports = {
  connect,
};
