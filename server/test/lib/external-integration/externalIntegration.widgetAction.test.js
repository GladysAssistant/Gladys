const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, ERROR_MESSAGES } = require('../../../utils/constants');
const { Error400 } = require('../../../utils/httpErrors');
const { NotFoundError, TooManyRequests, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService, TEST_WIDGET_MANIFEST } = require('./testUtils.test');

const PREFERENCES = { language: 'fr', units: 'metric' };
const CONTENT = {
  components: [
    { type: 'status', items: [{ label: 'State', value: 'Docked' }] },
    { type: 'button', label: 'Start', action: { key: 'start', params: { mode: 'full' } } },
  ],
};

const seedWidgetService = (overrides = {}) => seedExternalService({ manifest: TEST_WIDGET_MANIFEST, ...overrides });

// the content pull (first command) then the action ack (second command)
const contentThenAction = (actionResult = { success: true, data: { message: 'Cleaning started' } }) => {
  const sendCommand = fake((service, type) => {
    if (type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET) {
      return Promise.resolve({ success: true, data: { content: CONTENT } });
    }
    return actionResult instanceof Error ? Promise.reject(actionResult) : Promise.resolve(actionResult);
  });
  return sendCommand;
};

describe('externalIntegration widgets — runWidgetAction', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should 404 on an undeclared widget without any command', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedWidgetService();
    externalIntegration.sendCommand = contentThenAction();
    await expect(
      externalIntegration.runWidgetAction(service.selector, 'nope', 'start', {}, PREFERENCES),
    ).to.be.rejectedWith(NotFoundError, 'EXTERNAL_INTEGRATION_WIDGET_NOT_FOUND');
    sinonAssert.notCalled(externalIntegration.sendCommand);
  });

  it('should pull the content when nothing is cached and 404 on an action absent from it', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedWidgetService();
    externalIntegration.sendCommand = contentThenAction();
    await expect(
      externalIntegration.runWidgetAction(service.selector, 'upcoming_releases', 'stop', {}, PREFERENCES),
    ).to.be.rejectedWith(NotFoundError, 'EXTERNAL_INTEGRATION_WIDGET_ACTION_NOT_FOUND');
    // the content pull only: nothing about the unknown action reached the integration
    sinonAssert.calledOnce(externalIntegration.sendCommand);
    expect(externalIntegration.sendCommand.firstCall.args[1]).to.equal(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET,
    );
  });

  it('should relay widget.action with the declared params, the validated settings and the widget timeout', async () => {
    const { externalIntegration, event } = buildSupervisor();
    const service = await seedWidgetService();
    externalIntegration.sendCommand = contentThenAction();
    const result = await externalIntegration.runWidgetAction(
      service.selector,
      'upcoming_releases',
      'start',
      { region: 'FR' },
      PREFERENCES,
    );
    expect(result).to.deep.equal({ message: 'Cleaning started' });
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      sinon.match({ id: service.id, selector: service.selector }),
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_ACTION,
      {
        key: 'upcoming_releases',
        action_key: 'start',
        params: { mode: 'full' },
        settings: { region: 'FR', period_days: '30' },
      },
      { timeoutMs: 15000 },
    );
    // a success drops the cached content and tells the dashboards to refetch
    expect(externalIntegration.widgetContentCache.get(service.id).size).to.equal(0);
    sinonAssert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_UPDATED,
      payload: { selector: service.selector, key: 'upcoming_releases' },
    });
    // the cached content is reused for the next action: one command only
    externalIntegration.sendCommand.resetHistory();
    await externalIntegration.runWidgetAction(
      service.selector,
      'upcoming_releases',
      'start',
      { region: 'FR' },
      PREFERENCES,
    );
    expect(externalIntegration.sendCommand.callCount).to.equal(2);
  });

  it('should use the default 30 s timeout when the widget declares none', async () => {
    const { externalIntegration } = buildSupervisor();
    const manifest = {
      ...TEST_WIDGET_MANIFEST,
      widgets: [{ key: 'plain', label: { en: 'Plain widget' } }],
    };
    const service = await seedWidgetService({ manifest });
    externalIntegration.sendCommand = contentThenAction();
    await externalIntegration.runWidgetAction(service.selector, 'plain', 'start', {}, PREFERENCES);
    expect(externalIntegration.sendCommand.secondCall.args[3]).to.deep.equal({ timeoutMs: 30000 });
    expect(externalIntegration.sendCommand.secondCall.args[2].settings).to.deep.equal({});
  });

  it('should bound the result message: string, multi-language object, or null', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedWidgetService();
    const run = async (data) => {
      externalIntegration.sendCommand = contentThenAction({ success: true, data });
      const { message } = await externalIntegration.runWidgetAction(
        service.selector,
        'upcoming_releases',
        'start',
        {},
        PREFERENCES,
      );
      return message;
    };
    expect(await run({ message: 'x'.repeat(250) })).to.equal('x'.repeat(200));
    expect(await run({ message: { en: 'Started', fr: 'y'.repeat(250), 'not a language': 'z', de: 42 } })).to.deep.equal(
      {
        en: 'Started',
        fr: 'y'.repeat(200),
      },
    );
    expect(await run({ message: { fr: 'Sans anglais' } })).to.equal(null);
    expect(await run({ message: '' })).to.equal(null);
    expect(await run({ message: ['nope'] })).to.equal(null);
    expect(await run({})).to.equal(null);
    expect(await run(undefined)).to.equal(null);
  });

  it('should answer 429 beyond 30 actions per minute per integration', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedWidgetService();
    externalIntegration.sendCommand = contentThenAction();
    externalIntegration.widgetActionRates.set(service.id, { count: 30, resetAt: Date.now() + 60 * 1000 });
    await expect(
      externalIntegration.runWidgetAction(service.selector, 'upcoming_releases', 'start', {}, PREFERENCES),
    ).to.be.rejectedWith(TooManyRequests);
    sinonAssert.notCalled(externalIntegration.sendCommand);
  });

  it('should translate a refused, timed out or disconnected action into 400 with the bounded error', async () => {
    const { externalIntegration, event } = buildSupervisor();
    const service = await seedWidgetService();
    externalIntegration.sendCommand = contentThenAction(new ExternalIntegrationUnavailableError('Robot is offline'));
    try {
      await externalIntegration.runWidgetAction(service.selector, 'upcoming_releases', 'start', {}, PREFERENCES);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error400);
      expect(e.message).to.equal(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      expect(e.error).to.equal('Robot is offline');
    }
    // a failed action keeps the cached content and broadcasts nothing
    expect(externalIntegration.widgetContentCache.get(service.id).size).to.equal(1);
    sinonAssert.notCalled(event.emit);
  });
});
