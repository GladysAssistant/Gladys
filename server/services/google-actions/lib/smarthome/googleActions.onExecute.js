const logger = require('../../../../utils/logger');
const { EVENTS, ACTIONS, ACTIONS_STATUS } = require('../../../../utils/constants');
const { TRAIT_BY_COMMAND } = require('../traits');

const execSubCommand = (
  command,
  params,
  commands,
  requestedDeviceIds,
  errorneousDevices,
  pendingDevices,
  gladys,
  parentParam = '',
) => {
  Object.keys(params).forEach((param) => {
    const paramValue = params[param];

    if (typeof paramValue === 'object') {
      execSubCommand(
        command,
        paramValue,
        commands,
        requestedDeviceIds,
        errorneousDevices,
        pendingDevices,
        gladys,
        `${parentParam}${param}.`,
      );
    } else {
      const valueFunc = commands[parentParam + param];
      if (param === 'name') {
        logger.debug(`Google Actions: "name" is not a command, doing nothing`);
      } else if (!valueFunc) {
        // Param command key not found
        logger.error(`GoogleActions "${command} -> ${parentParam}${param}" command is not managed.`);
        // All devices are failure
        requestedDeviceIds.forEach((requestedDevice) => {
          errorneousDevices.push(requestedDevice);
        });
      } else {
        // If value function exists, update Gladys device
        const value = valueFunc.writeValue(paramValue, param);
        requestedDeviceIds.forEach((requestedDevice) => {
          valueFunc.features.forEach((f) => {
            const { category, type } = f;
            // Send execute command to Gladys
            const action = {
              type: ACTIONS.DEVICE.SET_VALUE,
              status: ACTIONS_STATUS.PENDING,
              value,
              device: requestedDevice,
              feature_category: category,
              feature_type: type,
            };
            gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
          });
          pendingDevices.push(requestedDevice);
        });
      }
    }
  });
};

/**
 * @description The function that will run for an EXECUTE request.
 * It should return a valid response or a Promise that resolves to valid response.
 * @param {object} body - Request body.
 * @param {object} headers - Request headers.
 * @returns {Promise} A valid response.
 * @example
 * googleActions.onExecute({}, {});
 * @see https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeapp.html#onexecute
 */
async function onExecute(body, headers) {
  // Get requested Gladys devices
  const pendingDevices = [];
  const errorneousDevices = [];

  body.inputs
    .filter((input) => input.payload && input.payload.commands)
    .forEach((input) => {
      input.payload.commands
        .filter((command) => {
          return command.devices && command.devices.length > 0;
        })
        .forEach((command) => {
          const { devices, execution } = command;
          const requestedDeviceIds = devices.map((d) => d.id);

          // Each execution triggered
          execution.forEach((exec) => {
            const trait = TRAIT_BY_COMMAND[exec.command];

            if (!trait || !trait.commands[exec.command]) {
              // Command key not found
              logger.error(`GoogleActions "${exec.command}" command is not managed.`);
              // All devices are failure
              requestedDeviceIds.forEach((requestedDevice) => {
                errorneousDevices.push(requestedDevice);
              });
            } else {
              const commands = trait.commands[exec.command];

              // Each sub-commands
              execSubCommand(
                exec.command,
                exec.params,
                commands,
                requestedDeviceIds,
                errorneousDevices,
                pendingDevices,
                this.gladys,
              );
            }
          });
        });
    });

  const commands = [];

  if (pendingDevices.length > 0) {
    commands.push({
      ids: pendingDevices,
      status: 'PENDING',
    });
  }

  if (errorneousDevices.length > 0) {
    commands.push({
      ids: errorneousDevices,
      status: 'ERROR',
    });
  }

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
