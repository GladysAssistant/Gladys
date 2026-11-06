import { Text } from 'preact-i18n';
import { Component, Fragment } from 'preact';
import { Link } from 'preact-router/match';
import { route } from 'preact-router';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import ContractsPage from './contracts/Contracts';
import ContractWizard from './contracts/ContractWizard';
import CalendarsSection from './contracts/Calendars';
import MyDevices from './MyDevices';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../server/utils/constants';
import { stripDeviceStatesForSave } from '../../../../utils/device';

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
    consumptionSettingsError: null
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

      const createdDevice = await this.props.httpClient.post('/api/v1/device', stripDeviceStatesForSave(newDevice));

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

  render(props, state) {
    const { loadingDevices, error } = state;

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
          <MyDevices
            httpClient={props.httpClient}
            devices={state.devices}
            loading={props.loading || loadingDevices}
            error={error}
            loadDevices={() => this.loadDevices()}
          />
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
