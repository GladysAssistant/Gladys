const logger = require('../../../../utils/logger');
const { ACTIONS, ACTIONS_STATUS, EVENTS } = require('../../../../utils/constants');

const { TRAIT_BY_COMMAND } = require('../traits');

/**
 * @description The function that will run for an EXECUTE request.
 * It should return a valid response or a Promise that resolves to valid response.
 * @param {object} body - Request body.
 * @returns {object} A valid response.
 * @example
 * googleActions.onExecute({});
 * @see https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeapp.html#onexecute
 */
function onExecute(body) {
  const commands = [];

  body.inputs
    .filter((input) => input.payload && input.payload.commands)
    .forEach((input) => {
      input.payload.commands
        .filter((command) => {
          return command.devices && command.devices.length > 0;
        })
        .forEach((command) => {
          const { devices, execution } = command;
          const requestedDevices = devices
            .map((device) => {
              // Load related device
              const gladysDevice = this.gladys.stateManager.get('device', device.id);

              if (!gladysDevice) {
                commands.push({ ids: [device.id], status: 'ERROR' });
              }

              return gladysDevice;
            })
            .filter(Boolean);

          requestedDevices.forEach((device) => {
            // Each execution triggered
            execution.forEach((exec) => {
              const trait = TRAIT_BY_COMMAND[exec.command];
              const deviceStatus = { ids: [device.selector], status: 'ERROR' };

              if (!trait || !trait.commands[exec.command]) {
                // Command key not found
                logger.error(`GoogleActions "${exec.command}" command is not managed.`);
                // All devices are failure
                deviceStatus.status = 'ERROR';
              } else {
                const commandExecutor = trait.commands[exec.command];

                // Build related feature events according incomping attributes
                const { events = [], states } = commandExecutor(device, exec.params);

                if (events.length > 0) {
                  events.forEach((eventMessage) => {
                    const action = {
                      type: ACTIONS.DEVICE.SET_VALUE,
                      status: ACTIONS_STATUS.PENDING,
                      device: device.selector,
                      ...eventMessage,
                    };
                    this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
                    deviceStatus.status = 'PENDING';
                  });
                }

                if (states) {
                  deviceStatus.status = 'SUCCESS';
                  deviceStatus.states = states;
                }
              }

              commands.push(deviceStatus);
            });
          });
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
