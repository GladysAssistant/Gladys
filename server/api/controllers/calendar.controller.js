const asyncMiddleware = require('../middlewares/asyncMiddleware');

/**
 * @apiDefine CalendarParam
 * @apiParam {String} name Name of the calendar.
 * @apiParam {String} description Description of the calendar
 * @apiParam {String} [selector] Selector of the calendar.
 * @apiParam {String} [external_id] External id of the calendar
 * @apiParam {Boolean} [sync] If Gladys need to sync the calendar or not
 * @apiParam {Boolean} [notify] If Gladys should by default notify the user about this calendar or not
 */

/**
 * @apiDefine CalendarEventParam
 * @apiParam {String} name Name of the event.
 * @apiParam {String} [selector] Selector of the event.
 * @apiParam {String} [external_id] External id of the calendar
 * @apiParam {String} [location] Location of the event
 * @apiParam {String} start datetime when the event start
 * @apiParam {String} [end] datetime when the event ends
 * @apiParam {String} [external_id] External id of the calendar
 * @apiParam {Boolean} [full_day] If the event takes the full day
 */

module.exports = function CalendarController(gladys) {
  /**
   * @api {post} /api/v1/calendar create
   * @apiName create
   * @apiGroup Calendar
   * @apiUse CalendarParam
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "b3eeebd8-58f2-4694-83a6-0b2cca871a5d",
   *   "name": "My calendar",
   *   "selector": "my-calendar"
   *   "description": "My personal events",
   *   "sync": true,
   *   "notify": false,
   *   "user_id": "e4e3f03e-60b9-485e-bc0a-c582b69089bd",
   *   "updated_at": "2019-05-09T03:14:29.820Z",
   *   "created_at": "2019-05-09T03:14:29.820Z"
   * }
   */
  async function create(req, res) {
    req.body.user_id = req.user.id;
    const calendar = await gladys.calendar.create(req.body);
    res.status(201).json(calendar);
  }

  /**
   * @api {patch} /api/v1/calendar/:calendar_selector update
   * @apiName update
   * @apiGroup Calendar
   * @apiUse CalendarParam
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "b3eeebd8-58f2-4694-83a6-0b2cca871a5d",
   *   "name": "My calendar",
   *   "selector": "my-calendar"
   *   "description": "My personal events",
   *   "sync": true,
   *   "notify": false,
   *   "user_id": "e4e3f03e-60b9-485e-bc0a-c582b69089bd",
   *   "updated_at": "2019-05-09T03:14:29.820Z",
   *   "created_at": "2019-05-09T03:14:29.820Z"
   * }
   */
  async function update(req, res) {
    const calendar = await gladys.calendar.update(req.params.calendar_selector, req.body);
    res.json(calendar);
  }

  /**
   * @api {delete} /api/v1/calendar/:calendar_selector delete
   * @apiName delete
   * @apiGroup Calendar
   */
  async function destroy(req, res) {
    await gladys.calendar.destroy(req.params.calendar_selector);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/calendar/:calendar_selector/event create event
   * @apiName create event
   * @apiGroup Calendar
   * @apiUse CalendarEventParam
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "f014c7e2-4e7d-422d-ac83-02d688e686b0",
   *   "full_day": false,
   *   "name": "Code on Gladys",
   *   "start": "2019-02-11T23:00:00.000Z",
   *   "end": "2019-02-12T09:00:00.000Z",
   *   "selector": "code-on-gladys",
   *   "calendar_id": "8afba93a-e94f-4255-9d8b-db9e605e10b6",
   *   "updated_at": "2019-05-09T03:22:47.150Z",
   *   "created_at": "2019-05-09T03:22:47.150Z"
   * }
   */
  async function createEvent(req, res) {
    const calendarEvent = await gladys.calendar.createEvent(req.params.calendar_selector, req.body);
    res.status(201).json(calendarEvent);
  }

  /**
   * @api {patch} /api/v1/calendar/event/:calendar_event_selector update event
   * @apiName update event
   * @apiGroup Calendar
   * @apiUse CalendarEventParam
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "f014c7e2-4e7d-422d-ac83-02d688e686b0",
   *   "full_day": false,
   *   "name": "Code on Gladys",
   *   "start": "2019-02-11T23:00:00.000Z",
   *   "end": "2019-02-12T09:00:00.000Z",
   *   "selector": "code-on-gladys",
   *   "calendar_id": "8afba93a-e94f-4255-9d8b-db9e605e10b6",
   *   "updated_at": "2019-05-09T03:22:47.150Z",
   *   "created_at": "2019-05-09T03:22:47.150Z"
   * }
   */
  async function updateEvent(req, res) {
    const calendarEvent = await gladys.calendar.updateEvent(req.params.calendar_event_selector, req.body);
    res.json(calendarEvent);
  }

  /**
   * @api {delete} /api/v1/calendar/event/:calendar_event_selector delete event
   * @apiName delete event
   * @apiGroup Calendar
   */
  async function destroyEvent(req, res) {
    await gladys.calendar.destroyEvent(req.params.calendar_event_selector);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/calendar get
   * @apiName get
   * @apiGroup Calendar
   * @apiSuccessExample {json} Success-Example
   * [{
   *   "id": "b3eeebd8-58f2-4694-83a6-0b2cca871a5d",
   *   "name": "My calendar",
   *   "selector": "my-calendar"
   *   "description": "My personal events",
   *   "sync": true,
   *   "notify": false,
   *   "user_id": "e4e3f03e-60b9-485e-bc0a-c582b69089bd",
   *   "updated_at": "2019-05-09T03:14:29.820Z",
   *   "created_at": "2019-05-09T03:14:29.820Z"
   * }]
   */
  async function get(req, res) {
    // cast shared boolean
    if (typeof req.query.shared === 'string') {
      req.query.shared = req.query.shared === 'true';
    }
    const calendars = await gladys.calendar.get(req.user.id, req.query);
    res.json(calendars);
  }

  /**
   * @api {get} /api/v1/calendar/event get events
   * @apiName getEvents
   * @apiGroup Calendar
   * @apiSuccessExample {json} Success-Example
   * [
   *   {
   *     "id": "f014c7e2-4e7d-422d-ac83-02d688e686b0",
   *     "calendar_id": "8afba93a-e94f-4255-9d8b-db9e605e10b6",
   *     "name": "Code on Gladys",
   *     "selector": "code-on-gladys",
   *     "external_id": null,
   *     "location": null,
   *     "start": "2019-05-09T00:00:00.000Z",
   *     "end": "2019-05-09T23:00:00.000Z",
   *     "full_day": false,
   *     "created_at": "2019-05-09T03:22:47.150Z",
   *     "updated_at": "2019-05-09T03:22:47.150Z",
   *     "calendar": {
   *       "name": "My calendar",
   *       "selector": "my-calendar"
   *     }
   *   }
   * ]
   */
  async function getEvents(req, res) {
    const calendarEvents = await gladys.calendar.getEvents(req.user.id, req.query);
    res.json(calendarEvents);
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    destroy: asyncMiddleware(destroy),
    update: asyncMiddleware(update),
    get: asyncMiddleware(get),
    getEvents: asyncMiddleware(getEvents),
    createEvent: asyncMiddleware(createEvent),
    updateEvent: asyncMiddleware(updateEvent),
    destroyEvent: asyncMiddleware(destroyEvent),
  });
};
