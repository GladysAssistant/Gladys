const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

/**
 * @description close task of the todolist.
 * @param {string} taskId - The task id.
 * @example
 * gladys.todolist.closeTask('taskId');
 */
function closeTask(taskId) {
  const todoistService = this.service.getService('todoist');
  if (todoistService === null) {
    throw new ServiceNotConfiguredError(`Service todoist is not found or not configured.`);
  }
  return todoistService.todolist.closeTask(taskId);
}

module.exports = {
  closeTask,
};
