const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

/**
 * @description Get the todolist.
 * @example
 * gladys.todolist.get();
 */
function get() {
  const todoistService = this.service.getService('todoist');
  if (todoistService === null) {
    throw new ServiceNotConfiguredError(`Service todoist is not found or not configured.`);
  }
  return todoistService.todolist.get();
}

module.exports = {
  get,
};
