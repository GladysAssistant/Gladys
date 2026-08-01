import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import Select from 'react-select';
import get from 'get-value';

import withIntlAsProp from '../../../utils/withIntlAsProp';
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

  // A source feature is auto-matched when exactly one unused destination
  // feature has the same category and type
  computeAutoMapping = destinationDevice => {
    const featuresMapping = {};
    const usedSelectors = new Set();
    (this.props.device.features || []).forEach(sourceFeature => {
      const candidates = destinationDevice.features.filter(
        feature =>
          feature.category === sourceFeature.category &&
          feature.type === sourceFeature.type &&
          !usedSelectors.has(feature.selector)
      );
      if (candidates.length === 1) {
        featuresMapping[sourceFeature.selector] = candidates[0].selector;
        usedSelectors.add(candidates[0].selector);
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
      </div>
    );
  };

  render(
    { device },
    { loading, devices, destinationDevice, featuresMapping, migrating, loadError, migrateError, networkError, report }
  ) {
    const sourceFeatures = device.features || [];
    const unmappedFeatures = sourceFeatures.filter(feature => !featuresMapping[feature.selector]);
    const deviceOptions = devices.map(candidate => ({
      value: candidate.selector,
      label: candidate.name
    }));
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
                      {!loadError && deviceOptions.length === 0 && !loading && (
                        <div class="alert alert-info">
                          <Text id="device.migrate.noDestinationAvailable" />
                        </div>
                      )}
                      {deviceOptions.length > 0 && (
                        <div class="form-group">
                          <label class="form-label">
                            <Text id="device.migrate.destinationLabel" />
                          </label>
                          <Select
                            options={deviceOptions}
                            value={
                              destinationDevice
                                ? { value: destinationDevice.selector, label: destinationDevice.name }
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
                        <button class="btn btn-primary mr-2" onClick={this.migrate} disabled={!destinationDevice}>
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
