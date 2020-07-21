const os = require('os');
const Serialport = require('serialport');
const Readline = require('@serialport/parser-readline');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Connect to Rflink
 * @param {string} Path - Path to the Rflink gateway.
 * @returns {string} Status.
 * @example
 * rflink.connect(Path);
 */
function connect(Path) {
  // special case for macOS
  if (os.platform() === 'darwin') {
    this.Path = Path.replace('/dev/tty.', '/dev/cu.');
  } else {
    this.Path = Path;
  }

  try {
    const port = new Serialport(this.Path, {
      baudRate: 57600,
      dataBits: 8,
      parity: 'none',
      autoOpen: false,
    });

    port.open(function (err) {
      if (err) {
        logger.log('error');
        this.connected = false;
        this.ready = false;
        this.scanInProgress = false;
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_FAILED,
        });
        return logger.log(`Error opening port: : ${err.message}`);
      }
      logger.log('info');
      return logger.log(`Success on opening port`);
    });

    const readline = new Readline({
      baudRate: 57600,
    });
    port.pipe(readline);
    this.usb = readline;
    this.sendUsb = port;
    logger.debug(`Rflink : Connecting to USB = ${Path}`);
    this.connected = true;
    this.ready = true;
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
