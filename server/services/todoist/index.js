const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

const TODOIST_API_KEY = 'TODOIST_API_KEY';
const REFRESH_INTERVAL_MS = 1 * 60 * 1000;

module.exports = function TodoistService(gladys, serviceId) {
  const { TodoistApi } = require('@doist/todoist-api-typescript');
  let todoistApi;

  let todolistIdsRefresh = [];

  /**
   * @public
   * @description This function starts the service.
   * @returns {Promise} Null.
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

    // refresh tasks every interval
    this.refreshInterval = setInterval(() => this.refreshTasks(), REFRESH_INTERVAL_MS);
  }

  /**
   * @private
   * @description Refresh tasks list for each todolist
   * @example
   * gladys.services.todoist.refreshTasks();
   */
  async function refreshTasks() {
    logger.info('Refresh tasks of todolist');
    await Promise.all(
      todolistIdsRefresh.map(async (todolistId) => {
        const tasks = await todoistApi.getTasks(todolistId !== '' ? { project_id: todolistId } : undefined);

        await gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.TODOLIST.UPDATED,
          payload: {
            todolistId: todolistId !== '' ? todolistId : undefined,
            tasks,
          },
        });
      }),
    );
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.todoist.stop();
   */
  async function stop() {
    logger.log('stopping Todoist service');

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    todolistIdsRefresh = [];
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
        const todolistId = options ? options.todolist_id : '';
        if (todolistIdsRefresh.indexOf(todolistId) === -1) {
          todolistIdsRefresh.push(todolistId);
        }

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
    refreshTasks,
    todolist: {
      getTasks,
      get,
      closeTask,
    },
  });
};
