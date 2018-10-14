/**
 * Don't remove, it is useful for generating documentation :)
 * @public
 * @name Television
 * @class
 */

module.exports.command = require('./television.command.js');
module.exports.switchState = require('./television.switchState.js');
module.exports.getState = require('./television.getState.js');
module.exports.setChannel = require('./television.setChannel.js');
module.exports.getChannel = require('./television.getChannel.js');
module.exports.getCurrentChannel = require('./television.getCurrentChannel.js');
module.exports.pause = require('./television.pause.js');
module.exports.play = require('./television.play.js');
module.exports.stop = require('./television.stop.js');
module.exports.fastForward = require('./television.fastForward.js');
module.exports.rewind = require('./television.rewind.js');
module.exports.setMuted = require('./television.setMuted.js');
module.exports.getMuted = require('./television.getMuted.js');
module.exports.setVolume = require('./television.setVolume.js');
module.exports.getVolume = require('./television.getVolume.js');
module.exports.volumeUp = require('./television.volumeUp.js');
module.exports.volumeDown = require('./television.volumeDown.js');
module.exports.pressKey = require('./television.pressKey.js');
module.exports.getSources = require('./television.getSources.js');
module.exports.openSource = require('./television.openSource.js');
module.exports.openMenu = require('./television.openMenu.js');
module.exports.rec = require('./television.rec.js');
module.exports.customCommand = require('./television.customCommand.js');
