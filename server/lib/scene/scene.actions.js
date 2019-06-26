const { ACTIONS } = require('../../utils/constants');
const logger = require('../../utils/logger');

const actionsFunc = {
  [ACTIONS.LIGHT.TURN_ON]: async (self, action, scope) => {
    const light = self.stateManager.get('device', action.device);
    return light.turnOn();
  },
  [ACTIONS.TIME.DELAY]: async (self, action, scope) =>
    new Promise((resolve) => {
      if (action.milliseconds) {
        setTimeout(resolve, action.milliseconds);
      } else if (action.seconds) {
        logger.debug(`Waiting ${action.seconds} seconds...`);
        setTimeout(resolve, action.seconds * 1000);
      } else if (action.minutes) {
        setTimeout(resolve, action.minutes * 1000 * 60);
      } else if (action.hours) {
        setTimeout(resolve, action.hours * 1000 * 60 * 60);
      }
    }),
  [ACTIONS.SERVICE.START]: async (self, action, scope) => self.stateManager.get('service', action.service).start(),
  [ACTIONS.SERVICE.STOP]: async (self, action, scope) => self.stateManager.get('service', action.service).stop(),
  [ACTIONS.SCENE.START]: async (self, action, scope) => self.execute(action.scene, scope),
  [ACTIONS.TELEGRAM.SEND]: async (self, action, scope) => {
    const user = self.stateManager.get('user', action.user);
    await self.stateManager.get('service', 'telegram').message.send(user.telegram_user_id, action.text);
  },
};

module.exports = {
  actionsFunc,
};
