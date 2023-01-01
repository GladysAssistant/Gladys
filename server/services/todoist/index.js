const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

const TODOIST_API_KEY = 'TODOIST_API_KEY';

module.exports = function TodoistService(gladys, serviceId) {
  const { TodoistApi } = require('@doist/todoist-api-typescript');
  let todoistApi;

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.todoist.start();
   */
  async function start() {
    logger.info('Starting Todoist service');
    const todoistApiKey = await gladys.variable.getValue(TODOIST_API_KEY, serviceId);
    if (!todoistApiKey) {
      throw new ServiceNotConfiguredError('Todoist Service not configured');
    }
    todoistApi = new TodoistApi(todoistApiKey);
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.todoist.stop();
   */
  async function stop() {
    logger.log('stopping Todoist service');
    todoistApi = null;
  }

  /**
   * @public
   * @description Get Todoist tasks.
   * @param {Object} options - Options to send to Todoist API.
   * @param {number} options.todolist_id - TodolistId to filter on.
   * @example
   * gladys.services.todolist.getTasks();
   */
  async function getTasks(options) {
    if (todoistApi) {
      try {
        const data = await todoistApi.getTasks(options ? { project_id: options.todolist_id } : undefined);
        return data;
      } catch (e) {
        logger.error(e);
        throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      }
    } else {
      throw new ServiceNotConfiguredError('Todoist Service not configured');
    }
  }

  /**
   * @public
   * @description Get Todolist from Todoist.
   * @example
   * gladys.services.todolist.get();
   */
  async function get() {
    if (todoistApi) {
      try {
        const data = await todoistApi.getProjects();
        return data;
      } catch (e) {
        logger.error(e);
        throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      }
    } else {
      throw new ServiceNotConfiguredError('Todoist Service not configured');
    }
  }

  /**
   * @public
   * @description clost Todoist tasks.
   * @param {string} taskId - Id of the task to close.
   * @example
   * gladys.services.todolist.closeTask('123');
   */
  async function closeTask(taskId) {
    if (todoistApi) {
      try {
        await todoistApi.closeTask(taskId);
      } catch (e) {
        logger.error(e);
        throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      }
    } else {
      throw new ServiceNotConfiguredError('Todoist Service not configured');
    }
  }
  return Object.freeze({
    start,
    stop,
    todolist: {
      getTasks,
      get,
      closeTask,
    },
  });
};
