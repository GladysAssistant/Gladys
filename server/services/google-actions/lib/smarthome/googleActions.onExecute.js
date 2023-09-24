const Promise = require('bluebird');

const logger = require('../../../../utils/logger');
const { ACTIONS, ACTIONS_STATUS, EVENTS } = require('../../../../utils/constants');

const { TRAIT_BY_COMMAND } = require('../traits');

/**
 * @description The function that will run for an EXECUTE request.
 * It should return a valid response or a Promise that resolves to valid response.
 * @param {object} body - Request body.
 * @returns {Promise<object>} A valid response.
 * @example
 * await googleActions.onExecute({});
 * @see https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeapp.html#onexecute
 */
async function onExecute(body) {
  const commands = [];

  const inputCommands = body.inputs
    .filter((input) => input.payload)
    .map((input) => input.payload)
    .map((payload) => payload.commands)
    .filter(Boolean)
    .flatMap((command) => command);

  await Promise.each(inputCommands, async ({ devices = [], execution }) => {
    await Promise.each(devices, async (device) => {
      const { id: selector } = device;
      // Load related device
      const gladysDevice = this.gladys.stateManager.get('device', selector);

      if (!gladysDevice) {
        commands.push({ ids: [selector], status: 'ERROR' });
      } else {
        // Each execution triggered
        await Promise.each(execution, async (exec) => {
          const trait = TRAIT_BY_COMMAND[exec.command];

          if (!trait || !trait.commands[exec.command]) {
            // Command key not found
            logger.error(`GoogleActions "${exec.command}" command is not managed.`);
            // All devices are failure
            commands.push({ ids: [selector], status: 'ERROR' });
          } else {
            const commandExecutor = trait.commands[exec.command];

            const deviceStatus = { ids: [selector], status: 'ERROR' };
            // Build related feature events according incomping attributes
            const { events = [] } = await commandExecutor(gladysDevice, exec.params, this.gladys);

            if (events.length > 0) {
              events.forEach((eventMessage) => {
                const action = {
                  type: ACTIONS.DEVICE.SET_VALUE,
                  status: ACTIONS_STATUS.PENDING,
                  device: selector,
                  ...eventMessage,
                };
                this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
              });
              deviceStatus.status = 'PENDING';
            }

            commands.push(deviceStatus);
          }
        });
      }
    });
  });

  return {
    requestId: body.requestId,
    payload: {
      agentUserId: body.user.id,
      commands,
    },
  };
}

module.exports = {
  onExecute,
};
