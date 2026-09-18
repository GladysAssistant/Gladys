import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { WEBSOCKET_MESSAGE_TYPES, USER_ROLE, ERROR_MESSAGES } from '../../../../../server/utils/constants';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import StatusBadge from '../../../routes/integration/all/external-integration/components/StatusBadge';
import { loadWidgetList, invalidateWidgetList, findWidgetDeclaration } from './widgetList';
import { splitIntoSlots, text, collectFeatureSelectors } from './widgetContentUtils';
import {
  WidgetHeader,
  WidgetBody,
  WidgetTiles,
  WidgetStatus,
  WidgetCardList,
  WidgetChart,
  LazyWidgetImage,
  WidgetButtons
} from './WidgetComponents';
import style from './style.css';

// Integration statuses and what the card does with them (spec section 12):
// a stopped integration is visible as stopped, never as a spinner; a degraded
// one still answers commands, so the content is pulled and a badge shown
const STOPPED_STATUSES = ['STOPPED', 'ERROR', 'DISABLED'];
const SERVING_STATUSES = ['RUNNING', 'DEGRADED'];

// a 429 keeps the last content and retries after this delay
const RATE_LIMITED_RETRY_MS = 60 * 1000;
const ACTION_MESSAGE_MS = 4000;

class ExternalWidgetBox extends Component {
  state = {
    declaration: undefined,
    integrationStatus: null,
    content: null,
    error: null,
    errorDetail: null,
    featuresBySelector: {},
    deviceNamesBySelector: {},
    pending: {},
    actionMessage: null
  };

  // --- declaration and status ---------------------------------------------

  loadDeclaration = async () => {
    const { box, httpClient } = this.props;
    try {
      const widgets = await loadWidgetList(httpClient);
      if (this.unmounted) {
        return;
      }
      const declaration = findWidgetDeclaration(widgets, box.integration, box.widget);
      const previousStatus = this.state.integrationStatus;
      this.setState({
        declaration,
        integrationStatus: declaration ? declaration.integration_status : null
      });
      if (declaration && SERVING_STATUSES.includes(declaration.integration_status)) {
        if (!SERVING_STATUSES.includes(previousStatus) || !this.state.content) {
          this.fetchContent();
        }
      }
    } catch (e) {
      console.error(e);
      if (!this.unmounted) {
        this.setState({ declaration: null, error: 'list' });
      }
    }
  };

  onStatusChanged = payload => {
    if (!payload || payload.selector !== this.props.box.integration) {
      return;
    }
    const wasServing = SERVING_STATUSES.includes(this.state.integrationStatus);
    // the shared list caches the statuses for a few seconds: a live change
    // must not be overwritten by a stale entry on the next mount
    invalidateWidgetList();
    this.setState({ integrationStatus: payload.status });
    if (SERVING_STATUSES.includes(payload.status) && !wasServing) {
      this.fetchContent();
    }
    if (STOPPED_STATUSES.includes(payload.status)) {
      this.clearRefreshTimer();
    }
  };

  // --- content --------------------------------------------------------------

  fetchContent = async () => {
    const { box, httpClient } = this.props;
    if (!SERVING_STATUSES.includes(this.state.integrationStatus)) {
      return;
    }
    this.clearRefreshTimer();
    const generation = (this.fetchGeneration || 0) + 1;
    this.fetchGeneration = generation;
    const query =
      box.settings && Object.keys(box.settings).length > 0 ? { settings: JSON.stringify(box.settings) } : {};
    try {
      const response = await httpClient.get(
        `/api/v1/external_integration/${encodeURIComponent(box.integration)}/widget/${encodeURIComponent(
          box.widget
        )}/content`,
        query
      );
      if (this.unmounted || generation !== this.fetchGeneration) {
        return;
      }
      this.setState({ content: response.content, error: null, errorDetail: null });
      this.scheduleRefresh(new Date(response.expires_at).getTime() - Date.now());
      this.loadFeatures(response.content.components);
    } catch (e) {
      if (this.unmounted || generation !== this.fetchGeneration) {
        return;
      }
      const status = get(e, 'response.status');
      const message = get(e, 'response.data.message');
      if (status === 429) {
        // the card keeps its last content and retries later
        this.setState({ error: this.state.content ? null : 'unavailable' });
        this.scheduleRefresh(RATE_LIMITED_RETRY_MS);
        return;
      }
      if (status === 422) {
        this.setState({ content: null, error: 'settings', errorDetail: get(e, 'response.data.properties') || null });
        return;
      }
      if (status === 400 && message === ERROR_MESSAGES.WIDGET_CONTENT_VERSION_UNSUPPORTED) {
        this.setState({ content: null, error: 'version', errorDetail: null });
        return;
      }
      if (status === 404) {
        this.setState({ content: null, error: 'notInstalled', errorDetail: null });
        return;
      }
      console.error(e);
      this.setState({ content: null, error: 'unavailable', errorDetail: get(e, 'response.data.error') || null });
    }
  };

  scheduleRefresh = delayMs => {
    this.clearRefreshTimer();
    // never earlier than a few seconds, never later than an hour: expiry is
    // the integration's word, the bounds are the card's
    const delay = Math.min(60 * 60 * 1000, Math.max(5000, delayMs || 0));
    this.refreshTimer = setTimeout(this.fetchContent, delay);
  };

  clearRefreshTimer = () => {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  };

  onWidgetUpdated = payload => {
    if (payload && payload.selector === this.props.box.integration && payload.key === this.props.box.widget) {
      this.fetchContent();
    }
  };

  onWebsocketConnected = ({ connected }) => {
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.wasDisconnected = false;
      // the statuses may have moved while the socket was down
      invalidateWidgetList();
      this.loadDeclaration();
    }
  };

  // --- live device bindings -------------------------------------------------

  loadFeatures = async components => {
    const selectors = collectFeatureSelectors(components);
    if (selectors.length === 0) {
      return;
    }
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_selectors: selectors.join(',')
      });
      if (this.unmounted) {
        return;
      }
      const featuresBySelector = {};
      const deviceNamesBySelector = {};
      devices.forEach(device => {
        device.features.forEach(feature => {
          featuresBySelector[feature.selector] = feature;
          deviceNamesBySelector[feature.selector] = device.name;
        });
      });
      this.setState({ featuresBySelector, deviceNamesBySelector });
    } catch (e) {
      console.error(e);
    }
  };

  onDeviceNewState = payload => {
    const { featuresBySelector } = this.state;
    if (!featuresBySelector[payload.device_feature_selector]) {
      return;
    }
    this.setState({
      featuresBySelector: {
        ...featuresBySelector,
        [payload.device_feature_selector]: {
          ...featuresBySelector[payload.device_feature_selector],
          last_value: payload.last_value,
          last_value_changed: payload.last_value_changed
        }
      }
    });
  };

  // --- buttons --------------------------------------------------------------

  setPending = (index, value) => {
    this.setState({ pending: { ...this.state.pending, [index]: value } });
  };

  showActionMessage = message => {
    this.setState({ actionMessage: message });
    if (this.actionMessageTimer) {
      clearTimeout(this.actionMessageTimer);
    }
    this.actionMessageTimer = setTimeout(() => this.setState({ actionMessage: null }), ACTION_MESSAGE_MS);
  };

  runAction = async (component, index) => {
    const { box, httpClient, intl, user } = this.props;
    if (this.state.pending[index]) {
      return;
    }
    if (component.action.confirm) {
      const label = text(component.label, user.language);
      const question = get(intl.dictionary, 'dashboard.boxes.external-widget.confirmAction', {
        default: 'Run "{{label}}"?'
      }).replace('{{label}}', label);
      // eslint-disable-next-line no-alert
      if (!window.confirm(question)) {
        return;
      }
    }
    this.setPending(index, true);
    try {
      const { message } = await httpClient.post(
        `/api/v1/external_integration/${encodeURIComponent(box.integration)}/widget/${encodeURIComponent(
          box.widget
        )}/action/${encodeURIComponent(component.action.key)}`,
        { settings: box.settings || {} }
      );
      if (message) {
        this.showActionMessage({ text: text(message, user.language) });
      }
    } catch (e) {
      console.error(e);
      this.showActionMessage({
        error: true,
        text: get(e, 'response.data.error') || null
      });
    }
    this.setPending(index, false);
  };

  runDeviceFeature = async (component, index) => {
    if (this.state.pending[index]) {
      return;
    }
    this.setPending(index, true);
    try {
      await this.props.httpClient.post(`/api/v1/device_feature/${component.device_feature_selector}/value`, {
        value: component.value
      });
      this.onDeviceNewState({
        device_feature_selector: component.device_feature_selector,
        last_value: component.value
      });
    } catch (e) {
      console.error(e);
      this.showActionMessage({ error: true, text: null });
    }
    this.setPending(index, false);
  };

  // --- lifecycle --------------------------------------------------------------

  componentDidMount() {
    this.loadDeclaration();
    const { dispatcher } = this.props.session;
    dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED, this.onStatusChanged);
    dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_UPDATED, this.onWidgetUpdated);
    dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.onDeviceNewState);
    dispatcher.addListener('websocket.connected', this.onWebsocketConnected);
  }

  // another widget picked in the editor: nothing of the previous one survives
  resetAndReload = () => {
    this.clearRefreshTimer();
    this.setState({ content: null, error: null, errorDetail: null, integrationStatus: null });
    this.loadDeclaration();
  };

  componentDidUpdate(previousProps) {
    const { box } = this.props;
    if (previousProps.box.integration !== box.integration || previousProps.box.widget !== box.widget) {
      this.resetAndReload();
    } else if (previousProps.box.settings !== box.settings) {
      this.fetchContent();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.clearRefreshTimer();
    if (this.actionMessageTimer) {
      clearTimeout(this.actionMessageTimer);
    }
    const { dispatcher } = this.props.session;
    dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED, this.onStatusChanged);
    dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_UPDATED, this.onWidgetUpdated);
    dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.onDeviceNewState);
    dispatcher.removeListener('websocket.connected', this.onWebsocketConnected);
  }

  // --- rendering --------------------------------------------------------------

  renderState(messageId, { icon = 'info', hint, detail, retry, children } = {}) {
    return (
      <div class={style.stateBox} data-cy="external-widget-state">
        <div>
          <i class={`fe fe-${icon} mr-2`} />
          <Text id={messageId} />
        </div>
        {hint && (
          <div class="text-muted small">
            <Text id={hint} />
          </div>
        )}
        {detail && <div class={style.errorDetail}>{detail}</div>}
        {retry && (
          <button type="button" class="btn btn-sm btn-outline-secondary" onClick={this.fetchContent}>
            <i class="fe fe-refresh-cw mr-1" />
            <Text id="dashboard.boxes.external-widget.retryButton" />
          </button>
        )}
        {children}
      </div>
    );
  }

  renderContent() {
    const { box, httpClient, user, intl } = this.props;
    const { content, featuresBySelector, deviceNamesBySelector, pending, actionMessage } = this.state;
    const language = user.language || 'en';
    const slots = splitIntoSlots(content.components);
    if (content.components.length === 0) {
      return this.renderState('dashboard.boxes.external-widget.empty', { icon: 'inbox' });
    }
    return (
      <div class={style.slots}>
        {slots.header.length > 0 && <WidgetHeader components={slots.header} language={language} />}
        {slots.tiles.length > 0 && (
          <WidgetTiles
            components={slots.tiles}
            featuresBySelector={featuresBySelector}
            deviceNamesBySelector={deviceNamesBySelector}
            language={language}
          />
        )}
        {slots.focal && slots.focal.type === 'chart' && (
          <WidgetChart
            component={slots.focal}
            httpClient={httpClient}
            language={language}
            user={user}
            dictionary={intl.dictionary}
            deviceNamesBySelector={deviceNamesBySelector}
          />
        )}
        {slots.focal && slots.focal.type === 'card-list' && (
          <WidgetCardList
            component={slots.focal}
            language={language}
            selector={box.integration}
            httpClient={httpClient}
          />
        )}
        {slots.focal && slots.focal.type === 'image' && (
          <LazyWidgetImage
            httpClient={httpClient}
            selector={box.integration}
            imageKey={slots.focal.key}
            alt={slots.focal.alt}
            fit={slots.focal.fit}
            language={language}
          />
        )}
        {slots.body && <WidgetBody component={slots.body} language={language} />}
        {slots.status && <WidgetStatus component={slots.status} language={language} />}
        {slots.buttons.length > 0 && (
          <WidgetButtons
            components={slots.buttons}
            featuresBySelector={featuresBySelector}
            pending={pending}
            onAction={this.runAction}
            onDeviceFeature={this.runDeviceFeature}
            language={language}
          />
        )}
        {actionMessage && (
          <div
            class={cx(style.actionMessage, { 'text-danger': actionMessage.error })}
            data-cy="external-widget-action-message"
          >
            {actionMessage.error && <Text id="dashboard.boxes.external-widget.actionError" />}
            {actionMessage.error && actionMessage.text ? ' — ' : ''}
            {actionMessage.text}
          </div>
        )}
      </div>
    );
  }

  render(props, { declaration, integrationStatus, content, error, errorDetail }) {
    const language = get(props, 'user.language') || 'en';
    const isAdmin = get(props, 'user.role') === USER_ROLE.ADMIN;
    const title = props.box.name || (declaration ? text(declaration.label, language) : '');
    const icon = (declaration && declaration.icon) || 'grid';
    let body;
    if (declaration === null || error === 'notInstalled') {
      body = this.renderState('dashboard.boxes.external-widget.notInstalled', {
        icon: 'alert-circle',
        hint: 'dashboard.boxes.external-widget.notInstalledHint'
      });
    } else if (declaration === undefined) {
      body = <div class={cx('dimmer active', style.skeleton)} />;
    } else if (STOPPED_STATUSES.includes(integrationStatus)) {
      body = this.renderState('dashboard.boxes.external-widget.stopped', {
        icon: 'power',
        children: isAdmin && (
          <Link href={`/dashboard/integration/device/external/${props.box.integration}/config`} class="small">
            <Text id="dashboard.boxes.external-widget.openIntegrationLink" />
          </Link>
        )
      });
    } else if (error === 'settings') {
      body = this.renderState('dashboard.boxes.external-widget.checkSettings', {
        icon: 'settings',
        hint: 'dashboard.boxes.external-widget.checkSettingsHint',
        detail: errorDetail
      });
    } else if (error === 'version') {
      body = this.renderState('dashboard.boxes.external-widget.needsNewerGladys', { icon: 'arrow-up-circle' });
    } else if (error === 'unavailable' || error === 'list') {
      body = this.renderState('dashboard.boxes.external-widget.unavailable', {
        icon: 'alert-triangle',
        detail: errorDetail,
        retry: true
      });
    } else if (!content) {
      body = <div class={cx('dimmer active', style.skeleton)} />;
    } else {
      body = this.renderContent();
    }
    return (
      <div class="card" data-cy="external-widget-box">
        <div class="card-header">
          <h3 class="card-title">
            <i class={`fe fe-${icon}`} />
            <span class="m-1">{title}</span>
          </h3>
          {integrationStatus === 'DEGRADED' && (
            <div class="card-options">
              <StatusBadge status={integrationStatus} />
            </div>
          )}
        </div>
        <div class="card-body">{body}</div>
      </div>
    );
  }
}

export default connect('httpClient,session,user', {})(withIntlAsProp(ExternalWidgetBox));
