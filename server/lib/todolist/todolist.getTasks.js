const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

/**
 * @description Get the tasks of the todolist.
 * @param {Object=} options - Options parameters.
 * @param {number} options.todolistId - The id of the todolist (optional).
 * @example
 * gladys.todolist.getTasks({
 *   todolistId: 112,
 * });
 */
function getTasks(options) {
  const todoistService = this.service.getService('todoist');
  if (todoistService === null) {
    throw new ServiceNotConfiguredError(`Service todoist is not found or not configured.`);
  }
  return todoistService.todolist.getTasks(options);
}

module.exports = {
  getTasks,
};
