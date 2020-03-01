const os = require('os');
const Serialport = require('serialport');
const Readline = require('@serialport/parser-readline');
const logger = require('../../../../utils/logger');

/**
 * @description Connect to Rflink
 * @param {string} Path - Path to the Rflink gateway.
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


    const port = new Serialport(this.Path, {
      baudRate : 57600,
      dataBits : 8,
      parity : 'none',
      autoOpen : true,
      
    });
    
    const readline = new Readline({
      baudRate : 57600,
    });
    logger.log(readline);
    port.pipe(readline);
    this.usb = readline;
    this.sendUsb = port;


    logger.debug(`Rflink : Connecting to USB = ${Path}`);

    this.connected = true;
    this.ready = true;
    this.listen();
    
  }
  
  module.exports = {
    connect,
  };
  