import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import Select from 'react-select';
import closeMenuOnScroll from '../../../utils/closeMenuOnScroll';
import get from 'get-value';

import withIntlAsProp from '../../../utils/withIntlAsProp';
import normalizeSearchText from '../../../utils/normalizeSearchText';
import { getDeviceIntegration, disambiguateIntegrationNames } from '../../../routes/devices/integrationLinks';
import style from './style.css';

class MigrateDeviceModal extends Component {
  state = {
    loading: true,
    devices: [],
    destinationDevice: null,
    featuresMapping: {},
    migrating: false,
    loadError: false,
    migrateError: false,
    networkError: false,
    report: null
  };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    this.loadDevices();
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = e => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  handleOverlayClick = e => {
    if (e.target === e.currentTarget) {
      this.close();
    }
  };

  close = () => {
    // Covers all close paths (X, Escape, overlay, Cancel): while a migration
    // is in flight, dismissing the modal would leave the request running blind
    if (this.state.migrating) {
      return;
    }
    // Once the migration succeeded, closing the modal must refresh the device list
    if (this.state.report && this.props.onMigrated) {
      this.props.onMigrated();
    }
    this.props.onClose();
  };

  loadDevices = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device');
      // The destination cannot be the source itself, nor another device of
      // the same (deprecated) integration
      const candidates = devices.filter(
        device => device.id !== this.props.device.id && device.service_id !== this.props.device.service_id
      );
      this.setState({ devices: candidates, loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loadError: true, loading: false });
    }
  };

  selectDestination = option => {
    if (!option) {
      this.setState({ destinationDevice: null, featuresMapping: {} });
      return;
    }
    const destinationDevice = this.state.devices.find(device => device.selector === option.value);
    this.setState({ destinationDevice, featuresMapping: this.computeAutoMapping(destinationDevice) });
  };

  getDeviceLabel = device => {
    const roomName = device.room ? device.room.name : get(this.props, 'intl.dictionary.device.noRoom');
    return `${device.name} (${roomName})`;
  };

  // Options are grouped by integration so that same-named devices don't get
  // confused with one another, and each option shows the room name for the
  // same reason. Grouping is keyed on the integration's slug (technical
  // identity), but the group is labelled and searched on the same
  // human-readable, translated/disambiguated name shown on the devices page
  // (getDeviceIntegration/disambiguateIntegrationNames), so e.g. a French
  // user typing "Caméras" still finds "rtsp-camera" devices.
  getDeviceOptions = () => {
    const unknownIntegrationLabel = get(this.props, 'intl.dictionary.device.migrate.unknownIntegration');
    const integrations = this.state.devices.map(candidate => getDeviceIntegration(candidate));
    const nameBySlug = disambiguateIntegrationNames(integrations);
    const getIntegrationLabel = integration => {
      if (!integration) {
        return unknownIntegrationLabel;
      }
      const translated = integration.i18nKey && get(this.props, `intl.dictionary.${integration.i18nKey}`);
      return translated || nameBySlug.get(integration.slug) || integration.name;
    };

    const groupsBySlug = new Map();
    this.state.devices.forEach((candidate, index) => {
      const integration = integrations[index];
      const groupKey = integration ? integration.slug : '';
      const integrationLabel = getIntegrationLabel(integration);
      if (!groupsBySlug.has(groupKey)) {
        groupsBySlug.set(groupKey, { label: integrationLabel, options: [] });
      }
      const label = this.getDeviceLabel(candidate);
      const roomName = candidate.room ? candidate.room.name : get(this.props, 'intl.dictionary.device.noRoom');
      groupsBySlug.get(groupKey).options.push({
        value: candidate.selector,
        label,
        searchText: normalizeSearchText(`${integrationLabel} ${roomName} ${label}`)
      });
    });
    const sortByLabel = (a, b) => a.label.localeCompare(b.label);
    return Array.from(groupsBySlug.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(group => ({ ...group, options: group.options.sort(sortByLabel) }));
  };

  // Every typed word must match (implicit AND) against integration + room + name
  filterOption = (option, rawInput) => {
    if (!rawInput) {
      return true;
    }
    const searchText = option.data.searchText || normalizeSearchText(option.label);
    return normalizeSearchText(rawInput)
      .split(/\s+/)
      .filter(Boolean)
      .every(word => searchText.includes(word));
  };

  // A source feature is auto-matched when exactly one unused destination
  // feature has the same category, type and unit (values are moved without
  // conversion, so a sole °F candidate must not be silently pre-selected
  // for a °C source — the user can still pick it manually, with a warning).
  // Multi-endpoint devices (e.g. a 2-gang Z-Wave switch) commonly have
  // several features sharing that triplet; when the triplet alone is
  // ambiguous, narrow the candidates down to those whose name is identical
  // to the source feature's — integrations that preserve endpoint naming
  // across a migration (like Z-Wave's `10-38-1-…` / `10-38-2-…`) then still
  // get an exact, unambiguous match instead of falling back to "do not
  // migrate" for every row.
  computeAutoMapping = destinationDevice => {
    const featuresMapping = {};
    const usedSelectors = new Set();
    (this.props.device.features || []).forEach(sourceFeature => {
      const candidates = destinationDevice.features.filter(
        feature =>
          feature.category === sourceFeature.category &&
          feature.type === sourceFeature.type &&
          (feature.unit || null) === (sourceFeature.unit || null) &&
          !usedSelectors.has(feature.selector)
      );
      let match = null;
      if (candidates.length === 1) {
        match = candidates[0];
      } else if (candidates.length > 1) {
        const sameName = candidates.filter(feature => feature.name === sourceFeature.name);
        if (sameName.length === 1) {
          match = sameName[0];
        }
      }
      if (match) {
        featuresMapping[sourceFeature.selector] = match.selector;
        usedSelectors.add(match.selector);
      }
    });
    return featuresMapping;
  };

  selectFeature = (sourceFeatureSelector, e) => {
    const featuresMapping = { ...this.state.featuresMapping };
    if (e.target.value === '') {
      delete featuresMapping[sourceFeatureSelector];
    } else {
      featuresMapping[sourceFeatureSelector] = e.target.value;
    }
    this.setState({ featuresMapping });
  };

  migrate = async () => {
    // Instance-level latch: setState is asynchronous, so two rapid clicks
    // could both pass a state-based guard before the button disables
    if (this.migrationInFlight) {
      return;
    }
    this.migrationInFlight = true;
    this.setState({ migrating: true, migrateError: false, networkError: false });
    try {
      const report = await this.props.httpClient.post(`/api/v1/device/${this.props.device.selector}/migrate`, {
        destination_device_selector: this.state.destinationDevice.selector,
        features_mapping: this.state.featuresMapping
      });
      this.setState({ report, migrating: false });
    } catch (e) {
      console.error(e);
      if (get(e, 'response.status') === undefined) {
        // The request may have timed out while the migration keeps running
        // server-side: point the user to the jobs page
        this.setState({ networkError: true, migrating: false });
      } else {
        this.setState({ migrateError: true, migrating: false });
      }
    } finally {
      this.migrationInFlight = false;
    }
  };

  getFeatureLabel = feature => {
    const categoryTypeLabel = get(
      this.props,
      `intl.dictionary.deviceFeatureCategory.${feature.category}.${feature.type}`
    );
    return categoryTypeLabel ? `${feature.name} (${categoryTypeLabel})` : feature.name;
  };

  renderFeatureRow = sourceFeature => {
    const { destinationDevice, featuresMapping } = this.state;
    const selectedSelector = featuresMapping[sourceFeature.selector] || '';
    const usedElsewhere = new Set(
      Object.keys(featuresMapping)
        .filter(selector => selector !== sourceFeature.selector)
        .map(selector => featuresMapping[selector])
    );
    const availableFeatures = destinationDevice.features.filter(feature => !usedElsewhere.has(feature.selector));
    // Same-type candidates first, so the compatible choices are on top
    const sortedFeatures = [
      ...availableFeatures.filter(feature => feature.type === sourceFeature.type),
      ...availableFeatures.filter(feature => feature.type !== sourceFeature.type)
    ];
    const selectedFeature = destinationDevice.features.find(feature => feature.selector === selectedSelector);
    const typeMismatch = selectedFeature && selectedFeature.type !== sourceFeature.type;
    // History is moved as raw numbers with no conversion: a different unit
    // (e.g. celsius vs fahrenheit) corrupts charts even when the type matches
    const unitMismatch =
      selectedFeature && !typeMismatch && (selectedFeature.unit || null) !== (sourceFeature.unit || null);
    return (
      <div class="form-group">
        <label class="form-label">{this.getFeatureLabel(sourceFeature)}</label>
        <select
          class="form-control"
          value={selectedSelector}
          onChange={e => this.selectFeature(sourceFeature.selector, e)}
        >
          <option value="">{get(this.props, 'intl.dictionary.device.migrate.doNotMigrate')}</option>
          {sortedFeatures.map(feature => (
            <option value={feature.selector}>{this.getFeatureLabel(feature)}</option>
          ))}
        </select>
        {typeMismatch && (
          <small class="text-warning">
            <Text id="device.migrate.typeMismatchWarning" />
          </small>
        )}
        {unitMismatch && (
          <small class="text-warning">
            <Text id="device.migrate.unitMismatchWarning" />
          </small>
        )}
      </div>
    );
  };

  render(
    { device },
    { loading, devices, destinationDevice, featuresMapping, migrating, loadError, migrateError, networkError, report }
  ) {
    const sourceFeatures = device.features || [];
    const unmappedFeatures = sourceFeatures.filter(feature => !featuresMapping[feature.selector]);
    const deviceGroups = this.getDeviceOptions();
    const hasDeviceOptions = devices.length > 0;
    return (
      <div class={style.modalOverlay} onClick={this.handleOverlayClick}>
        <div class={style.modalDialog}>
          <div class="card mb-0">
            <div class="card-header">
              <h3 class="card-title">
                <Text id="device.migrate.modalTitle" fields={{ name: device.name }} />
              </h3>
              <div class="card-options">
                <button type="button" class="btn btn-secondary btn-sm" onClick={this.close}>
                  <i class="fe fe-x" />
                </button>
              </div>
            </div>
            <div
              class={cx('dimmer', {
                active: loading || migrating
              })}
            >
              <div class="loader" />
              <div class="dimmer-content">
                <div class="card-body">
                  {report && (
                    <div>
                      <div class="alert alert-success">
                        <MarkupText
                          id="device.migrate.successText"
                          fields={{
                            states: new Intl.NumberFormat().format(report.duck_db_states_migrated),
                            scenes: report.scenes_updated.length,
                            dashboards: report.dashboards_updated.length
                          }}
                        />
                      </div>
                      <button class="btn btn-primary" onClick={this.close}>
                        <Text id="device.migrate.closeButton" />
                      </button>
                    </div>
                  )}
                  {!report && (
                    <div>
                      <div class="alert alert-warning">
                        <MarkupText id="device.migrate.description" />
                      </div>
                      {loadError && (
                        <div class="alert alert-danger">
                          <Text id="device.migrate.loadError" />
                        </div>
                      )}
                      {!loadError && !hasDeviceOptions && !loading && (
                        <div class="alert alert-info">
                          <Text id="device.migrate.noDestinationAvailable" />
                        </div>
                      )}
                      {hasDeviceOptions && (
                        <div class="form-group">
                          <label class="form-label">
                            <Text id="device.migrate.destinationLabel" />
                          </label>
                          <Select
                            options={deviceGroups}
                            filterOption={this.filterOption}
                            menuPlacement="auto"
                            menuPortalTarget={document.body}
                            closeMenuOnScroll={closeMenuOnScroll}
                            classNamePrefix="react-select"
                            value={
                              destinationDevice
                                ? { value: destinationDevice.selector, label: this.getDeviceLabel(destinationDevice) }
                                : null
                            }
                            onChange={this.selectDestination}
                            isClearable
                          />
                        </div>
                      )}
                      {destinationDevice && sourceFeatures.length > 0 && (
                        <div>
                          <h4>
                            <Text id="device.migrate.featuresTitle" />
                          </h4>
                          {sourceFeatures.map(this.renderFeatureRow)}
                          {unmappedFeatures.length > 0 && (
                            <div class="alert alert-warning">
                              <Text id="device.migrate.unmappedWarning" />
                            </div>
                          )}
                        </div>
                      )}
                      {migrateError && (
                        <div class="alert alert-danger">
                          <Text id="device.migrate.migrateError" />
                        </div>
                      )}
                      {networkError && (
                        <div class="alert alert-warning">
                          <MarkupText id="device.migrate.networkError" />
                        </div>
                      )}
                      <div class="form-group mb-0">
                        <button
                          class="btn btn-primary mr-2"
                          onClick={this.migrate}
                          disabled={!destinationDevice || migrating}
                        >
                          <Text id="device.migrate.confirmButton" />
                        </button>
                        <button class="btn btn-secondary" onClick={this.close}>
                          <Text id="device.migrate.cancelButton" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(MigrateDeviceModal));
