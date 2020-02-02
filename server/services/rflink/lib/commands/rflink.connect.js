const os = require('os');
const logger = require('../../../../utils/logger');

/**
 * @description Connect to Rflink
 * @param {string} Path - Path to the Rflink gateway.
 * @example
 * rflink.connect(Path);
 */
function connect(Path) {
    logger.debug(`Rflink : Connecting to USB = ${Path}`);
    // special case for macOS
    if (os.platform() === 'darwin') {
      this.Path = Path.replace('/dev/tty.', '/dev/cu.');
    } else {
      this.Path = Path;
    }
    this.connected = true;
    this.listen();
    
  }
  
  module.exports = {
    connect,
  };
  