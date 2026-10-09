import { Text } from 'preact-i18n';
import { Component, Fragment } from 'preact';
import { Link } from 'preact-router/match';
import { route } from 'preact-router';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import ContractsPage from './contracts/Contracts';
import ContractWizard from './contracts/ContractWizard';
import CalendarsSection from './contracts/Calendars';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../server/utils/constants';

const DEVICE_FEATURE_CATEGORIES_TO_DISPLAY = [
  DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SWITCH,
  DEVICE_FEATURE_CATEGORIES.TELEINFORMATION
];

const DEVICE_FEATURE_TYPES_TO_DISPLAY = [
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
  DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF02,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF03,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF04,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF05,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF06,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF07,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF08,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF09,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF10
];

class EnergyMonitoringPage extends Component {
  state = {
    devices: [],
    loadingDevices: false,
    error: null,
    // Settings state
    calculatingFromBeginning: false,
    calculatingConsumptionFromBeginning: false,
    settingsSuccess: null,
    settingsError: null,
    consumptionSettingsSuccess: null,
    consumptionSettingsError: null,
    // Circular dependency detection
    circularDependencies: [],
    fixingCircularDependencies: false
  };

  calculateFromBeginning = async () => {
    try {
      this.setState({ calculatingFromBeginning: true, settingsError: null, settingsSuccess: null });
      await this.props.httpClient.post('/api/v1/service/energy-monitoring/calculate-cost-from-beginning', {});
      this.setState({ settingsSuccess: 'ok' });
      // Redirect to jobs page
      route('/dashboard/settings/jobs');
    } catch (e) {
      this.setState({ settingsError: e });
    } finally {
      this.setState({ calculatingFromBeginning: false });
    }
  };

  calculateConsumptionFromIndexFromBeginning = async () => {
    try {
      this.setState({
        calculatingConsumptionFromBeginning: true,
        consumptionSettingsError: null,
        consumptionSettingsSuccess: null
      });
      await this.props.httpClient.post(
        '/api/v1/service/energy-monitoring/calculate-consumption-from-index-from-beginning',
        {}
      );
      this.setState({ consumptionSettingsSuccess: 'ok' });
      // Redirect to jobs page
      route('/dashboard/settings/jobs');
    } catch (e) {
      this.setState({ consumptionSettingsError: e });
    } finally {
      this.setState({ calculatingConsumptionFromBeginning: false });
    }
  };

  componentDidMount() {
    this.loadDevices();
  }

  // ----- ROUTE HELPERS -----
  getPath() {
    return (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
  }

  isContractsRoute() {
    const path = this.getPath();
    return (
      path.startsWith('/dashboard/integration/device/energy-monitoring') &&
      (path.includes('/contracts') || path.includes('/prices'))
    );
  }

  isCreateContractRoute() {
    return this.getPath().includes('/contracts/create');
  }

  getEditedContractSelector() {
    const match = this.getPath().match(/\/contracts\/edit\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  isSettingsRoute() {
    const path = this.getPath();
    return path.startsWith('/dashboard/integration/device/energy-monitoring') && path.includes('/settings');
  }

  async loadDevices() {
    try {
      this.setState({ loadingDevices: true });
      const result = await this.props.httpClient.get('/api/v1/device', {});
      this.setState({ devices: Array.isArray(result) ? result : [], error: null });
    } catch (e) {
      this.setState({ error: e });
    } finally {
      this.setState({ loadingDevices: false });
    }
  }

  createElectricMeter = async () => {
    try {
      this.setState({ loadingDevices: true, error: null });

      // Get the MQTT service ID
      const mqttService = await this.props.httpClient.get('/api/v1/service/mqtt');
      const serviceId = mqttService.id;

      // Generate a unique external_id like MQTT does
      const timestamp = Date.now();
      const newDevice = {
        name: this.props.intl.dictionary.integration.energyMonitoring.electricMeterDeviceName || 'Electric Meter',
        external_id: `mqtt:electric-meter-${timestamp}`,
        selector: `mqtt:electric-meter-${timestamp}`,
        service_id: serviceId,
        should_poll: false,
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            name:
              this.props.intl.dictionary.integration.energyMonitoring.electricMeterFeatureName ||
              'Electric Meter Index',
            external_id: `mqtt:electric-meter-${timestamp}-index`,
            selector: `mqtt:electric-meter-${timestamp}-index`,
            unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
            read_only: true,
            has_feedback: false,
            min: 0,
            max: 10000000000
          }
        ],
        params: []
      };

      const createdDevice = await this.props.httpClient.post('/api/v1/device', newDevice);

      // Reload devices to include the new one
      await this.loadDevices();
      return createdDevice;
    } catch (error) {
      console.error(error);
      this.setState({ error });
      return null;
    } finally {
      this.setState({ loadingDevices: false });
    }
  };

  getAllFeatures() {
    const flat = [];
    const { devices } = this.state;
    devices.forEach(device => {
      (device.features || [])
        .filter(
          feature =>
            feature &&
            DEVICE_FEATURE_CATEGORIES_TO_DISPLAY.includes(feature.category) &&
            DEVICE_FEATURE_TYPES_TO_DISPLAY.includes(feature.type)
        )
        .forEach(feature => {
          flat.push({ ...feature, __device: device });
        });
    });
    return flat;
  }

  detectCircularDependencies() {
    const allFeatures = this.getAllFeatures();
    const featureMap = new Map();
    allFeatures.forEach(f => featureMap.set(f.id, f));

    const circularDependencies = [];

    allFeatures.forEach(feature => {
      if (!feature.energy_parent_id) return;

      const visited = new Set();
      let current = feature;
      const chain = [feature];

      while (current && current.energy_parent_id) {
        if (visited.has(current.id)) {
          // Found a circular dependency
          circularDependencies.push({
            feature,
            chain: [...chain],
            type: current.id === feature.id ? 'self' : 'cycle'
          });
          break;
        }
        visited.add(current.id);
        const parent = featureMap.get(current.energy_parent_id);
        if (!parent) {
          // Parent doesn't exist - broken reference
          circularDependencies.push({
            feature,
            chain: [...chain],
            type: 'broken',
            missingParentId: current.energy_parent_id
          });
          break;
        }
        current = parent;
        chain.push(current);
      }
    });

    return circularDependencies;
  }

  fixCircularDependencies = async () => {
    const circularDeps = this.detectCircularDependencies();
    if (circularDeps.length === 0) return;

    this.setState({ fixingCircularDependencies: true });

    try {
      // Find the highest point in each broken chain to fix
      // We only want to fix the root cause, not the children (like 30min cost/consumption)
      const featuresToFix = new Set();

      for (const dep of circularDeps) {
        if (dep.type === 'broken') {
          // For broken references, find the feature that points to the missing parent
          // This is the last feature in the chain that has a valid parent reference to a missing ID
          const chainWithBrokenRef = dep.chain;
          for (let i = 0; i < chainWithBrokenRef.length; i += 1) {
            const f = chainWithBrokenRef[i];
            if (f.energy_parent_id === dep.missingParentId) {
              featuresToFix.add(f.id);
              break;
            }
          }
        } else if (dep.type === 'self' || dep.type === 'cycle') {
          // For circular references, fix the first feature in the chain (highest in hierarchy)
          // that is part of the cycle
          featuresToFix.add(dep.feature.id);
        }
      }

      // Get all features to access by ID
      const allFeatures = this.getAllFeatures();
      const featureMap = new Map();
      allFeatures.forEach(f => featureMap.set(f.id, f));

      // Fix only the identified features
      for (const featureId of featuresToFix) {
        const feature = featureMap.get(featureId);
        if (feature && feature.selector) {
          await this.props.httpClient.patch(`/api/v1/device_feature/${feature.selector}`, {
            energy_parent_id: null
          });
        }
      }
      // Reload devices to get updated state
      await this.loadDevices();
    } catch (e) {
      this.setState({ error: e });
    } finally {
      this.setState({ fixingCircularDependencies: false });
    }
  };

  getTree() {
    const allFeatures = this.getAllFeatures();
    const children = new Map();
    allFeatures.forEach(f => {
      children.set(f.id, []);
    });
    const rootFeatures = [];
    allFeatures.forEach(f => {
      const parentId = f.energy_parent_id || null;
      if (parentId && children.has(parentId)) {
        children.get(parentId).push(f);
      } else {
        rootFeatures.push(f);
      }
    });
    return { rootFeatures, childrenById: children, allFeatures };
  }

  async setParentLocal(featureId, newParentId) {
    const { allFeatures } = this.getTree();
    const feature = allFeatures.find(f => f.id === featureId);
    const selector = feature && feature.selector;
    const previousParentId = feature ? feature.energy_parent_id || null : null;

    // optimistic update
    this.setState(({ devices }) => ({
      devices: devices.map(d => ({
        ...d,
        features: (d.features || []).map(f =>
          f.id === featureId ? { ...f, energy_parent_id: newParentId || null } : f
        )
      }))
    }));

    if (selector) {
      try {
        await this.props.httpClient.patch(`/api/v1/device_feature/${selector}`, {
          energy_parent_id: newParentId || null
        });
      } catch (e) {
        // rollback on error
        this.setState(({ devices }) => ({
          devices: devices.map(d => ({
            ...d,
            features: (d.features || []).map(f =>
              f.id === featureId ? { ...f, energy_parent_id: previousParentId } : f
            )
          })),
          error: e
        }));
      }
    }
  }

  render(props, state) {
    const { rootFeatures, childrenById, allFeatures } = this.getTree();
    const { loadingDevices, error } = state;

    const getDescendantIds = id => {
      const stack = [id];
      const visited = new Set();
      visited.add(id);
      const result = new Set();
      while (stack.length) {
        const current = stack.pop();
        const children = childrenById.get(current) || [];
        children.forEach(c => {
          if (!visited.has(c.id)) {
            visited.add(c.id);
            result.add(c.id);
            stack.push(c.id);
          }
        });
      }
      return result;
    };

    const renderFeature = (feature, depth = 0) => {
      const paddingLeft = depth > 0 ? 8 + Math.min(depth, 2) * 12 : 0;
      const label = `${feature.__device ? feature.__device.name : ''} - ${feature.name ||
        feature.selector ||
        feature.id}`;
      const levelColors = ['#5c7cfa', '#40c057', '#fab005', '#fa5252', '#12b886', '#7950f2'];
      const color = levelColors[depth % levelColors.length];
      const descendantIds = getDescendantIds(feature.id);

      const isChildFeature =
        feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION ||
        feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST;
      // const hasParentId = feature.energy_parent_id !== null && feature.energy_parent_id !== undefined;
      const canModifyParent = true; // Temporary fix, should be !isChildFeature || !hasParentId;
      return (
        <div class={isChildFeature ? 'mb-1' : 'mb-2'} style={{ paddingLeft: `${paddingLeft}px` }}>
          <div
            class="card shadow-sm"
            style={{ borderLeft: `${isChildFeature ? '3px' : '4px'} solid ${color}`, borderRadius: '6px' }}
          >
            <div class={isChildFeature ? 'card-body py-1 px-2' : 'card-body py-2 px-2 px-md-3'}>
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center">
                <div class="flex-grow-1 w-100 w-md-auto mb-2 mb-md-0">
                  <div class="d-flex align-items-center flex-wrap">
                    <span
                      class={isChildFeature ? 'badge mr-2' : 'badge mr-2 mb-1'}
                      style={{ background: color, color: '#fff', fontSize: isChildFeature ? '0.7em' : undefined }}
                    >
                      <Text id="integration.energyMonitoring.level" fields={{ depth }} />
                    </span>
                    <span class={isChildFeature ? 'small' : 'mb-1'}>
                      <strong>{label}</strong>
                    </span>
                  </div>
                  {!isChildFeature && (
                    <div class="small text-muted mt-1" style={{ wordBreak: 'break-all' }}>
                      {feature.selector}
                    </div>
                  )}
                </div>
                {canModifyParent && (
                  <div class="w-100 w-md-auto mt-2 mt-md-0 ml-md-3" style={{ minWidth: '0', maxWidth: '100%' }}>
                    <select
                      class="form-control form-control-sm w-100"
                      style={{ minWidth: '200px' }}
                      value={feature.energy_parent_id || ''}
                      onChange={e => this.setParentLocal(feature.id, e.target.value || null)}
                    >
                      <option value="">
                        <Text id="integration.energyMonitoring.rootNotParent" />
                      </option>
                      {allFeatures
                        .filter(f => f.id !== feature.id && !descendantIds.has(f.id))
                        .map(f => (
                          <option key={f.id} value={f.id}>
                            {(f.__device ? `${f.__device.name} - ` : '') + (f.name || f.selector || f.id)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
          {(childrenById.get(feature.id) || []).map(child => (
            <div key={`${feature.id}-${child.id}`}>{renderFeature(child, depth + 1)}</div>
          ))}
        </div>
      );
    };

    const renderSettings = () => (
      <div>
        <div class="card">
          <div class="card-header">
            <h1 class="card-title">
              <Text id="integration.energyMonitoring.settings" defaultMessage="Settings" />
            </h1>
          </div>
          <div class="card-body">
            {state.settingsError && (
              <div class="alert alert-danger" role="alert">
                <Text
                  id="integration.energyMonitoring.calculateFromBeginningError"
                  defaultMessage="An error occurred while starting the calculation."
                />
              </div>
            )}
            {state.settingsSuccess && (
              <div class="alert alert-success" role="alert">
                <Text
                  id="integration.energyMonitoring.calculateFromBeginningStarted"
                  defaultMessage="Calculation started. You can follow progress in Jobs."
                />
              </div>
            )}
            {state.consumptionSettingsError && (
              <div class="alert alert-danger" role="alert">
                <Text
                  id="integration.energyMonitoring.calculateConsumptionFromBeginningError"
                  defaultMessage="An error occurred while starting the consumption calculation."
                />
              </div>
            )}
            {state.consumptionSettingsSuccess && (
              <div class="alert alert-success" role="alert">
                <Text
                  id="integration.energyMonitoring.calculateConsumptionFromBeginningStarted"
                  defaultMessage="Consumption calculation started. You can follow progress in Jobs."
                />
              </div>
            )}
            <div class="mb-4">
              <p class="text-muted">
                <Text
                  id="integration.energyMonitoring.calculateConsumptionFromIndexDescription"
                  defaultMessage="This will calculate the energy consumption (in kWh) from your energy meter index readings. Use this if you have index data and want to compute the actual consumption between readings."
                />
              </p>
              <p>
                <button
                  class="btn btn-primary"
                  disabled={state.calculatingConsumptionFromBeginning}
                  onClick={this.calculateConsumptionFromIndexFromBeginning}
                >
                  {state.calculatingConsumptionFromBeginning ? (
                    <span>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
                      <Text
                        id="integration.energyMonitoring.calculatingConsumptionFromBeginning"
                        defaultMessage="Starting consumption calculation..."
                      />
                    </span>
                  ) : (
                    <span>
                      <i class="fe fe-play mr-2" />
                      <Text
                        id="integration.energyMonitoring.calculateConsumptionFromIndexFromBeginning"
                        defaultMessage="Calculate consumption from index from beginning"
                      />
                    </span>
                  )}
                </button>
              </p>
            </div>
            <div class="mb-4">
              <p class="text-muted">
                <Text
                  id="integration.energyMonitoring.calculateCostFromBeginningDescription"
                  defaultMessage="This will calculate the cost of your energy consumption based on your consumption data and electricity prices. Use this after you have consumption data and configured your electricity prices."
                />
              </p>
              <p>
                <button
                  class="btn btn-primary"
                  disabled={state.calculatingFromBeginning}
                  onClick={this.calculateFromBeginning}
                >
                  {state.calculatingFromBeginning ? (
                    <span>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
                      <Text
                        id="integration.energyMonitoring.calculatingFromBeginning"
                        defaultMessage="Starting calculation..."
                      />
                    </span>
                  ) : (
                    <span>
                      <i class="fe fe-play mr-2" />
                      <Text
                        id="integration.energyMonitoring.calculateCostFromBeginning"
                        defaultMessage="Calculate cost from beginning"
                      />
                    </span>
                  )}
                </button>
              </p>
            </div>
          </div>
        </div>
        <CalendarsSection httpClient={props.httpClient} />
      </div>
    );

    const editedContractSelector = this.getEditedContractSelector();
    const showingWizard = this.isCreateContractRoute() || editedContractSelector !== null;
    const showingContracts = this.isContractsRoute();
    const showingSettings = this.isSettingsRoute();

    return (
      <IntegrationSubPageLayout
        title={<Text id="integration.energyMonitoring.title" />}
        tabs={
          <Fragment>
            <Link href="/dashboard/integration/device/energy-monitoring" activeClassName="active" class="hz-tab-link">
              <i class="fe fe-grid" />
              <span>
                <Text id="integration.energyMonitoring.myDevicesTab" />
              </span>
            </Link>

            <Link
              href="/dashboard/integration/device/energy-monitoring/contracts"
              activeClassName="active"
              class="hz-tab-link"
            >
              <i class="fe fe-file-text" />
              <span>
                <Text id="integration.energyMonitoring.contracts.tab" />
              </span>
            </Link>

            <Link
              href="/dashboard/integration/device/energy-monitoring/settings"
              activeClassName="active"
              class="hz-tab-link"
            >
              <i class="fe fe-settings" />
              <span>
                <Text id="integration.energyMonitoring.settings" defaultMessage="Settings" />
              </span>
            </Link>

            <DeviceConfigurationLink
              user={props.user}
              configurationKey="integrations"
              documentKey="energy-monitoring"
              linkClass="hz-tab-link"
            >
              <i class="fe fe-book-open" />
              <span>
                <Text id="integration.energyMonitoring.documentation" />
              </span>
            </DeviceConfigurationLink>
          </Fragment>
        }
      >
        {!showingContracts && !showingSettings && (
          <div class="card">
            <div class="card-body">
              <div class={cx('dimmer', { active: props.loading || loadingDevices })}>
                <div class="loader" />
                <div class="dimmer-content">
                  {error && (
                    <div class="alert alert-danger" role="alert">
                      <Text id="integration.energyMonitoring.errorLoadingDevices" />
                    </div>
                  )}
                  {(() => {
                    const circularDeps = this.detectCircularDependencies();
                    if (circularDeps.length > 0) {
                      return (
                        <div class="alert alert-warning" role="alert">
                          <div class="d-flex align-items-start justify-content-between">
                            <div>
                              <h4 class="alert-heading">
                                <i class="fe fe-alert-triangle mr-2" />
                                <Text id="integration.energyMonitoring.circularDependencyDetected" />
                              </h4>
                              <p class="mb-2">
                                <Text id="integration.energyMonitoring.circularDependencyDescription" />
                              </p>
                              <ul class="mb-0">
                                {circularDeps.map((dep, idx) => {
                                  const featureName = dep.feature.__device
                                    ? `${dep.feature.__device.name} - ${dep.feature.name || dep.feature.selector}`
                                    : dep.feature.name || dep.feature.selector;
                                  return (
                                    <li key={idx}>
                                      <strong>{featureName}</strong>
                                      {dep.type === 'broken' && (
                                        <span class="text-muted ml-1">
                                          (<Text id="integration.energyMonitoring.brokenReference" />)
                                        </span>
                                      )}
                                      {dep.type === 'cycle' && (
                                        <span class="text-muted ml-1">
                                          (<Text id="integration.energyMonitoring.circularReference" />)
                                        </span>
                                      )}
                                      {dep.type === 'self' && (
                                        <span class="text-muted ml-1">
                                          (<Text id="integration.energyMonitoring.selfReference" />)
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                            <button
                              class="btn btn-warning ml-3 text-nowrap flex-shrink-0"
                              onClick={this.fixCircularDependencies}
                              disabled={state.fixingCircularDependencies}
                            >
                              {state.fixingCircularDependencies ? (
                                <span>
                                  <span
                                    class="spinner-border spinner-border-sm mr-2"
                                    role="status"
                                    aria-hidden="true"
                                  />
                                  <Text id="integration.energyMonitoring.fixing" />
                                </span>
                              ) : (
                                <span>
                                  <i class="fe fe-tool mr-2" />
                                  <Text id="integration.energyMonitoring.fixAutomatically" />
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <p>
                    <Text id="integration.energyMonitoring.hierarchicalListDescription" />
                  </p>
                  <div>
                    {rootFeatures.map(f => (
                      <div key={f.id}>{renderFeature(f, 0)}</div>
                    ))}
                    {rootFeatures.length === 0 && !loadingDevices && (
                      <div class="text-muted">
                        <Text id="integration.energyMonitoring.noDeviceFeaturesFound" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showingContracts && !showingWizard && (
          <ContractsPage httpClient={props.httpClient} user={props.user} devices={state.devices} />
        )}
        {showingWizard && (
          <ContractWizard
            httpClient={props.httpClient}
            user={props.user}
            devices={state.devices}
            loadDevices={() => this.loadDevices()}
            createElectricMeter={this.createElectricMeter}
            selector={editedContractSelector}
          />
        )}
        {showingSettings && renderSettings()}
      </IntegrationSubPageLayout>
    );
  }
}

export default withIntlAsProp(EnergyMonitoringPage);
