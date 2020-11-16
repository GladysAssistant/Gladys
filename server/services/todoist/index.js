const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');
const TodoistController = require('./api/todoist.controller');
const { generateProjectsTree } = require('./lib')

const TODOIST_API_KEY = 'TODOIST_API_KEY';

module.exports = function TodoistService(gladys, serviceId) {
  const { default: axios } = require('axios');
  let todoistApiKey;

  function ensureApiKey() {
    if (!todoistApiKey) {
      throw new ServiceNotConfiguredError('Todoist Service not configured');
    }
  }

  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.todoist.start();
   */
  async function start() {
    logger.info('Starting Todoist service');
    todoistApiKey = await gladys.variable.getValue(TODOIST_API_KEY, serviceId);
    ensureApiKey();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.todoist.stop();
   */
  async function stop() {
    logger.log('stopping Todoist service');
  }

  /**
   * @description Get Todoist tasks.
   * @param {Object} options
   * @param {number} options.projectId
   * @example
   * gladys.services.todoist.getTasks();
   */
  async function getTasks(options) {
    ensureApiKey();

    const url = `https://api.todoist.com/rest/v1/tasks`;
    try {
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${todoistApiKey}` }, params: options });
      logger.debug(`Found ${data.length} task(s).`);
      return data;
    } catch (e) {
      logger.error(e);
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
  }

  /**
   * @description Get Todoist tasks.
   * @example
   * gladys.services.todoist.getProjects();
   */
  async function getProjects() {
    ensureApiKey();

    const url = `https://api.todoist.com/rest/v1/projects`;
    try {
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${todoistApiKey}` } });
      logger.debug(`Found ${data.length} project(s).`);
      return generateProjectsTree(data);
    } catch (e) {
      logger.error(e);
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
  }

  /**
   * @description Get Todoist tasks.
   * @param {number} task_id
   * @example
   * gladys.services.todoist.completeTask(123);
   */
  async function completeTask(task_id) {
    ensureApiKey();

    const url = `https://api.todoist.com/rest/v1/tasks/${task_id}/close`;
    try {
      await axios.post(url, {}, { headers: { Authorization: `Bearer ${todoistApiKey}` } });
      logger.debug(`Completed task #${task_id}`);
    } catch (e) {
      logger.error(e);
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
  }

  const service = {
    start,
    stop,
    getTasks,
    getProjects,
    completeTask,
  };

  return Object.freeze({
    ...service,
    controllers: TodoistController(service),
  });
};
