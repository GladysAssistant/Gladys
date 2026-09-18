const logger = require('../../utils/logger');
const { WIDGET_REFRESH_MIN_INTERVAL_MS } = require('./constants');
const { findDeclaredWidget } = require('./externalIntegration.validateWidgetSettings');

/**
 * @description Handle the freshness nudge of a dashboard widget
 * (`widget.refresh`, section 3 of capabilities/dashboard-widgets.md —
 * "trigger, not data"): drop the cached contents of (integration, widget
 * key) and tell every open dashboard to refetch through the audited pull
 * path; the nudge itself carries nothing. Fire-and-forget: a nudge for an
 * undeclared key, or beyond 1 per 10 s per (integration, key), is silently
 * dropped — a dropped nudge costs at most one TTL.
 * @param {object} service - The sending integration service.
 * @param {object} [payload] - The message payload ({ key }).
 * @example
 * externalIntegration.handleWidgetRefresh(service, { key: 'vacuum' });
 */
function handleWidgetRefresh(service, payload = {}) {
  const widgetKey = payload && payload.key;
  if (typeof widgetKey !== 'string' || !findDeclaredWidget(service, widgetKey)) {
    logger.debug(`widget.refresh nudge from ${service.selector} for an undeclared widget: ignored`);
    return;
  }
  const now = Date.now();
  const timeKey = `${service.id}:${widgetKey}`;
  const lastNudge = this.widgetRefreshTimes.get(timeKey);
  if (lastNudge !== undefined && now - lastNudge < WIDGET_REFRESH_MIN_INTERVAL_MS) {
    logger.debug(`widget.refresh nudge from ${service.selector} for ${widgetKey} rate-limited: ignored`);
    return;
  }
  this.widgetRefreshTimes.set(timeKey, now);
  this.invalidateWidgetContent(service, widgetKey, { broadcast: true });
}

module.exports = {
  handleWidgetRefresh,
};
