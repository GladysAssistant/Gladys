const db = require('../../models');
const { BadParameters, ForbiddenError, NotFoundError, TooManyRequests } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES, SYSTEM_VARIABLE_NAMES, DEFAULT_TIMEZONE } = require('../../utils/constants');
const {
  DEVICE_FEATURES_SOURCE,
  DEVICE_FEATURES_GRANT_KEY,
  MAX_DEVICE_FEATURE_STATE_SELECTORS,
  MAX_DEVICE_FEATURE_STATE_READS_PER_MINUTE,
  MAX_DEVICE_FEATURE_AGGREGATE_READS_PER_MINUTE,
  DEVICE_FEATURE_AGGREGATE_INTERVALS,
  MAX_DEVICE_FEATURE_AGGREGATE_BUCKETS,
} = require('./constants');

// Designated device features (capabilities/device-feature-read.md): an
// integration declaring `device_features_read: true` reads the features of
// OTHER integrations that the user picked in one of its `source:
// "device_features"` config fields — and nothing else. The scope is the
// grant the core records when the user saves the Configuration screen, never
// the config value itself (see DEVICE_FEATURES_GRANT_KEY).

// Buckets in the Gladys timezone, so a `1d` bucket is a local day. The
// interval comes from the DEVICE_FEATURE_AGGREGATE_INTERVALS whitelist.
const AGGREGATE_QUERY = `
  SELECT
    time_bucket(CAST(? AS INTERVAL), created_at, ?) AS created_at,
    AVG(value) AS value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    SUM(value) AS sum_value,
    COUNT(value) AS count_value
  FROM t_device_feature_state
  WHERE device_feature_id = ?
    AND created_at >= CAST(? AS TIMESTAMPTZ)
    AND created_at < CAST(? AS TIMESTAMPTZ)
  GROUP BY 1
  ORDER BY 1
`;

/**
 * @description Tell if the manifest declares the `device_features_read`
 * authorization contract. Only an explicit true opens the read API.
 * @param {object} service - The external integration service.
 * @returns {boolean} True when the gate is declared.
 * @example
 * hasDeviceFeaturesRead({ manifest: { device_features_read: true } });
 */
function hasDeviceFeaturesRead(service) {
  return Boolean(service.manifest) && service.manifest.device_features_read === true;
}

/**
 * @description Read the designations recorded for an integration, by field
 * key. A missing or malformed record is an empty grant.
 * @param {object} service - The external integration service.
 * @returns {Promise<object>} Resolve with { [fieldKey]: [selector] }.
 * @example
 * const grant = await readGrant.call(externalIntegration, service);
 */
async function readGrant(service) {
  const rawGrant = await this.variable.getValue(DEVICE_FEATURES_GRANT_KEY, service.id);
  try {
    const grant = JSON.parse(rawGrant);
    return grant !== null && typeof grant === 'object' && !Array.isArray(grant) ? grant : {};
  } catch (e) {
    return {};
  }
}

/**
 * @description Get the selectors the user designated for an integration:
 * the recorded grant of the `source: "device_features"` fields its current
 * manifest still declares, and only when it declares `device_features_read`.
 * @param {object} service - The external integration service.
 * @returns {Promise<Set>} Resolve with the designated feature selectors.
 * @example
 * const selectors = await gladys.externalIntegration.getDeviceFeatureGrant(service);
 */
async function getDeviceFeatureGrant(service) {
  const selectors = new Set();
  if (!hasDeviceFeaturesRead(service)) {
    return selectors;
  }
  const fields = (service.manifest.config_schema || []).filter((field) => field.source === DEVICE_FEATURES_SOURCE);
  if (fields.length === 0) {
    return selectors;
  }
  const grant = await readGrant.call(this, service);
  fields.forEach((field) => {
    const designated = Array.isArray(grant[field.key]) ? grant[field.key] : [];
    designated.filter((selector) => typeof selector === 'string').forEach((selector) => selectors.add(selector));
  });
  return selectors;
}

/**
 * @description Refresh the in-memory designations used to push the new
 * states of the designated features to the integration (called when it
 * connects and when the user saves its config).
 * @param {object} service - The external integration service.
 * @returns {Promise} Resolve when refreshed.
 * @example
 * await gladys.externalIntegration.refreshDeviceFeatureGrant(service);
 */
async function refreshDeviceFeatureGrant(service) {
  const selectors = await this.getDeviceFeatureGrant(service);
  if (selectors.size === 0) {
    this.deviceFeatureReadGrants.delete(service.id);
    return;
  }
  this.deviceFeatureReadGrants.set(service.id, { service, selectors });
}

/**
 * @description Record the device features the user designated in the
 * Configuration screen (called by saveConfigFromFront with the validated
 * values). Only the `source: "device_features"` fields present in the
 * payload are updated, like the partial merge of the config itself; `null`
 * withdraws the designation of a select.
 * @param {object} service - The external integration service.
 * @param {object} values - The validated config values being saved.
 * @returns {Promise} Resolve when recorded.
 * @example
 * await saveDeviceFeatureGrant.call(externalIntegration, service, { grid_power: 'linky-papp' });
 */
async function saveDeviceFeatureGrant(service, values) {
  const configSchema = (service.manifest && service.manifest.config_schema) || [];
  const fields = configSchema.filter(
    (field) => field.source === DEVICE_FEATURES_SOURCE && Object.prototype.hasOwnProperty.call(values, field.key),
  );
  if (fields.length === 0) {
    return;
  }
  const grant = await readGrant.call(this, service);
  fields.forEach((field) => {
    const value = values[field.key];
    grant[field.key] = value === null ? [] : [].concat(value);
  });
  await this.variable.setValue(DEVICE_FEATURES_GRANT_KEY, JSON.stringify(grant), service.id);
  await this.refreshDeviceFeatureGrant(service);
}

/**
 * @description Fixed one-minute window rate limit, in memory per integration
 * (same pattern as POST /state).
 * @param {Map} rateLimits - The serviceId -> { count, resetAt } map.
 * @param {object} service - The external integration service.
 * @param {number} max - Max requests per minute.
 * @example
 * checkRateLimit(this.deviceFeatureStateRateLimits, service, 120);
 */
function checkRateLimit(rateLimits, service, max) {
  const now = Date.now();
  let rateLimit = rateLimits.get(service.id);
  if (!rateLimit || now >= rateLimit.resetAt) {
    rateLimit = { count: 0, resetAt: now + 60 * 1000 };
    rateLimits.set(service.id, rateLimit);
  }
  if (rateLimit.count >= max) {
    throw new TooManyRequests(
      `RATE_LIMIT_EXCEEDED: max ${max} requests per minute`,
      Math.ceil((rateLimit.resetAt - now) / 1000),
    );
  }
  rateLimit.count += 1;
}

/**
 * @description Refuse any selector the user did not designate for this
 * integration. Checked before any existence check: a 403 never tells whether
 * a feature exists.
 * @param {object} service - The external integration service.
 * @param {Array} selectors - The requested selectors.
 * @returns {Promise} Resolve when every selector is designated.
 * @example
 * await assertDesignated.call(externalIntegration, service, ['linky-papp']);
 */
async function assertDesignated(service, selectors) {
  const granted = await this.getDeviceFeatureGrant(service);
  const refused = selectors.filter((selector) => !granted.has(selector));
  if (refused.length > 0) {
    throw new ForbiddenError(`selectors: not designated by the user for this integration: ${refused.join(', ')}`);
  }
}

/**
 * @description Refuse an integration that does not declare the gate.
 * @param {object} service - The external integration service.
 * @example
 * assertGate(service);
 */
function assertGate(service) {
  if (!hasDeviceFeaturesRead(service)) {
    throw new ForbiddenError('device_features_read: reading device features is not declared in the manifest');
  }
}

/**
 * @description Get a designated feature from the state manager, 404 when it
 * no longer exists (device deleted since the user picked it).
 * @param {string} selector - The feature selector.
 * @returns {object} The device feature.
 * @example
 * const feature = getExistingFeature.call(externalIntegration, 'linky-papp');
 */
function getExistingFeature(selector) {
  const feature = this.stateManager.get('deviceFeature', selector);
  if (!feature) {
    throw new NotFoundError(`device_feature not found: ${selector}`);
  }
  return feature;
}

/**
 * @description GET /device_feature/state of the host API: the current state
 * of designated device features.
 * @param {object} service - The external integration service.
 * @param {string} selectorsParam - Comma-separated feature selectors.
 * @returns {Promise<Array>} Resolve with one state per selector, in the requested order.
 * @example
 * await gladys.externalIntegration.getDesignatedDeviceFeatureStates(service, 'linky-papp,linky-east');
 */
async function getDesignatedDeviceFeatureStates(service, selectorsParam) {
  assertGate(service);
  if (typeof selectorsParam !== 'string') {
    throw new BadParameters('selectors: must be a comma-separated list of device feature selectors');
  }
  const selectors = [
    ...new Set(
      selectorsParam
        .split(',')
        .map((selector) => selector.trim())
        .filter((selector) => selector.length > 0),
    ),
  ];
  if (selectors.length === 0 || selectors.length > MAX_DEVICE_FEATURE_STATE_SELECTORS) {
    throw new BadParameters(`selectors: must list 1-${MAX_DEVICE_FEATURE_STATE_SELECTORS} device feature selectors`);
  }
  checkRateLimit(this.deviceFeatureStateRateLimits, service, MAX_DEVICE_FEATURE_STATE_READS_PER_MINUTE);
  await assertDesignated.call(this, service, selectors);
  const missing = selectors.filter((selector) => !this.stateManager.get('deviceFeature', selector));
  if (missing.length > 0) {
    throw new NotFoundError(`device_feature not found: ${missing.join(', ')}`);
  }
  return selectors.map((selector) => {
    const feature = this.stateManager.get('deviceFeature', selector);
    return {
      selector,
      name: feature.name,
      category: feature.category,
      type: feature.type,
      unit: feature.unit,
      last_value: feature.last_value,
      last_value_string: feature.last_value_string,
      last_value_changed: feature.last_value_changed,
    };
  });
}

/**
 * @description Parse an ISO 8601 date of the aggregate query.
 * @param {any} value - The query value.
 * @param {string} name - The parameter name, for error messages.
 * @returns {Date} The parsed date.
 * @example
 * parseDate('2026-01-12T00:00:00Z', 'from');
 */
function parseDate(value, name) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new BadParameters(`${name}: must be an ISO 8601 date string`);
  }
  return new Date(value);
}

/**
 * @description GET /device_feature/aggregate of the host API: the history of
 * one designated feature, aggregated by 30 minutes, hour or day (buckets in
 * the Gladys timezone), from the states the core keeps for it.
 * @param {object} service - The external integration service.
 * @param {object} query - The query string: selector, from, to and interval.
 * @returns {Promise<object>} Resolve with { selector, unit, interval, values }.
 * @example
 * await gladys.externalIntegration.getDesignatedDeviceFeatureAggregates(service, {
 *   selector: 'linky-east', from: '2026-01-12T00:00:00Z', to: '2026-01-13T00:00:00Z', interval: '30m',
 * });
 */
async function getDesignatedDeviceFeatureAggregates(service, query) {
  assertGate(service);
  const { selector, interval } = query;
  if (typeof selector !== 'string' || selector.length === 0) {
    throw new BadParameters('selector: must be a device feature selector');
  }
  if (!Object.prototype.hasOwnProperty.call(DEVICE_FEATURE_AGGREGATE_INTERVALS, interval)) {
    throw new BadParameters(`interval: must be one of ${Object.keys(DEVICE_FEATURE_AGGREGATE_INTERVALS).join(', ')}`);
  }
  const from = parseDate(query.from, 'from');
  const to = parseDate(query.to, 'to');
  if (from >= to) {
    throw new BadParameters('from: must be before to');
  }
  const bucket = DEVICE_FEATURE_AGGREGATE_INTERVALS[interval];
  if ((to.getTime() - from.getTime()) / bucket.ms > MAX_DEVICE_FEATURE_AGGREGATE_BUCKETS) {
    throw new BadParameters(
      `from: at most ${MAX_DEVICE_FEATURE_AGGREGATE_BUCKETS} ${interval} buckets per request, narrow the range`,
    );
  }
  checkRateLimit(this.deviceFeatureAggregateRateLimits, service, MAX_DEVICE_FEATURE_AGGREGATE_READS_PER_MINUTE);
  await assertDesignated.call(this, service, [selector]);
  const feature = getExistingFeature.call(this, selector);
  const timezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || DEFAULT_TIMEZONE;
  const rows = await db.duckDbReadConnectionAllAsync(
    AGGREGATE_QUERY,
    bucket.sql,
    timezone,
    feature.id,
    from.toISOString(),
    to.toISOString(),
  );
  return {
    selector,
    unit: feature.unit,
    interval,
    values: rows.map((row) => ({
      created_at: row.created_at,
      value: row.value,
      min_value: row.min_value,
      max_value: row.max_value,
      sum_value: row.sum_value,
      count_value: Number(row.count_value),
    })),
  };
}

/**
 * @description Push the new state of a designated feature to every
 * connected integration it is designated for (EVENTS.TRIGGERS.CHECK
 * listener, the same hook the Google Home / Alexa forwarding uses).
 * Fire-and-forget, no ack, lost while the integration is disconnected: it
 * resynchronizes with GET /device_feature/state at (re)connection.
 * @param {object} event - The trigger check event.
 * @example
 * gladys.externalIntegration.forwardDeviceFeatureState({ type: 'device.new-state', device_feature: 'linky-papp' });
 */
function forwardDeviceFeatureState(event) {
  if (event.type !== EVENTS.DEVICE.NEW_STATE || this.deviceFeatureReadGrants.size === 0) {
    return;
  }
  // a text feature carries its state as a string (saveStringState)
  const valueKey = typeof event.last_value === 'string' ? 'last_value_string' : 'last_value';
  this.deviceFeatureReadGrants.forEach(({ service, selectors }) => {
    if (!selectors.has(event.device_feature)) {
      return;
    }
    this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_FEATURE_NEW_STATE, {
      selector: event.device_feature,
      [valueKey]: event.last_value,
      last_value_changed: event.last_value_changed,
    });
  });
}

module.exports = {
  getDeviceFeatureGrant,
  refreshDeviceFeatureGrant,
  saveDeviceFeatureGrant,
  getDesignatedDeviceFeatureStates,
  getDesignatedDeviceFeatureAggregates,
  forwardDeviceFeatureState,
};
