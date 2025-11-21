import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../server/utils/constants';

const KNOWN_CONTRACT_TYPES = ['peak-off-peak', 'tempo', 'base'];

class ImportPricesPage extends Component {
  state = {
    // Loading states
    loadingContracts: false,
    loadingDevices: false,
    importing: false,
    // Data
    contracts: [],
    devices: [],
    // Form data
    selectedDeviceId: '',
    selectedContractId: '',
    selectedPower: '',
    // Errors
    contractsError: null,
    devicesError: null,
    importError: null,
    // Success
    importSuccess: false
  };

  componentDidMount() {
    this.loadContracts();
    this.loadDevices();
  }

  loadContracts = async () => {
    try {
      this.setState({ loadingContracts: true, contractsError: null });
      const contractsData = await this.props.httpClient.get('/api/v1/service/energy-monitoring/contracts');

      // Transform the contracts object into an array for easier handling
      const contracts = Object.keys(contractsData).map(contractId => ({
        id: contractId,
        name: this.formatContractName(contractId),
        powers: Object.keys(contractsData[contractId]),
        data: contractsData[contractId]
      }));

      this.setState({ contracts });
    } catch (error) {
      this.setState({ contractsError: error });
    } finally {
      this.setState({ loadingContracts: false });
    }
  };

  formatContractName = contractId => {
    // Contract ID format: "provider-contract-type" (e.g., "edf-base", "edf-peak-off-peak")
    const parts = contractId.split('-');

    if (parts.length < 2) {
      // Fallback if format is unexpected
      return contractId;
    }

    // Determine contract type by checking known suffixes (longest first)
    let contractType = parts[parts.length - 1];
    let providerParts = parts.slice(0, parts.length - 1);

    for (const type of KNOWN_CONTRACT_TYPES) {
      const typeParts = type.split('-');
      const matches = parts.slice(-typeParts.length).join('-') === type;
      if (matches) {
        contractType = type;
        providerParts = parts.slice(0, parts.length - typeParts.length);
        break;
      }
    }

    const provider = providerParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

    // Try to get translation for contract type
    const translation = get(this.props.intl.dictionary, `integration.energyMonitoring.contractTypes.${contractType}`);

    if (translation) {
      return `${provider} ${translation}`;
    }

    // Fallback: capitalize each word of contract type
    const formattedContractType = contractType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${provider} ${formattedContractType}`;
  };

  loadDevices = async () => {
    try {
      this.setState({ loadingDevices: true, devicesError: null });
      const devices = await this.props.httpClient.get('/api/v1/device');

      // Filter devices to only show electric meters
      const electricMeters = devices.filter(
        device =>
          device.features &&
          device.features.some(feature => feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR)
      );

      this.setState({ devices: electricMeters });
    } catch (error) {
      this.setState({ devicesError: error });
    } finally {
      this.setState({ loadingDevices: false });
    }
  };

  handleDeviceChange = async e => {
    const value = e.target.value;

    if (value === 'CREATE_NEW') {
      await this.createElectricMeter();
    } else {
      this.setState({ selectedDeviceId: value });
    }
  };

  createElectricMeter = async () => {
    try {
      this.setState({ loadingDevices: true, devicesError: null });

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

      // Select the newly created device
      this.setState({ selectedDeviceId: createdDevice.id });
    } catch (error) {
      console.error(error);
      this.setState({ devicesError: error });
    } finally {
      this.setState({ loadingDevices: false });
    }
  };

  handleContractChange = e => {
    this.setState({ selectedContractId: e.target.value });
  };

  handlePowerChange = e => {
    this.setState({ selectedPower: e.target.value });
  };

  handleImport = async () => {
    const { selectedDeviceId, selectedContractId, selectedPower, contracts } = this.state;

    if (!selectedDeviceId || !selectedContractId || !selectedPower) {
      this.setState({ importError: 'Please fill in all required fields' });
      return;
    }

    try {
      this.setState({ importing: true, importError: null });

      const selectedContract = contracts.find(c => c.id === selectedContractId);
      if (!selectedContract) {
        throw new Error('Selected contract not found');
      }

      const powerData = selectedContract.data[selectedPower];
      if (!powerData || !Array.isArray(powerData)) {
        throw new Error('No price data found for selected power');
      }

      // Import each price period from the contract
      for (const priceData of powerData) {
        const pricePayload = {
          ...priceData,
          electric_meter_device_id: selectedDeviceId,
          subscribed_power: selectedPower
        };

        await this.props.httpClient.post('/api/v1/energy_price', pricePayload);
      }

      this.setState({ importSuccess: true });

      // Optionally redirect back to prices page after successful import
      setTimeout(() => {
        window.location.href = '/dashboard/integration/device/energy-monitoring/prices';
      }, 2000);
    } catch (error) {
      this.setState({ importError: error.message || 'Import failed' });
    } finally {
      this.setState({ importing: false });
    }
  };

  render(props, state) {
    const {
      loadingContracts,
      loadingDevices,
      importing,
      contracts,
      devices,
      selectedDeviceId,
      selectedContractId,
      selectedPower,
      contractsError,
      devicesError,
      importError,
      importSuccess
    } = state;

    const selectedContract = contracts.find(c => c.id === selectedContractId);
    const availablePowers = selectedContract ? selectedContract.powers || [] : [];

    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.energyMonitoring.importPricesTitle" defaultMessage="Import Energy Contract Prices" />
          </h3>
        </div>
        <div class="card-body">
          {importSuccess && (
            <div class="alert alert-success">
              <Text id="integration.energyMonitoring.importSuccess" defaultMessage="Prices imported successfully!" />
            </div>
          )}

          {importError && <div class="alert alert-danger">{importError}</div>}

          <div class="mb-3">
            <p class="text-muted">
              <Text
                id="integration.energyMonitoring.selectElectricMeterDescription"
                defaultMessage="You can either use an existing electric meter from another integration (e.g., Enedis), or automatically create a new electric meter here."
              />
            </p>
            <label class="form-label required">
              <Text
                id="integration.energyMonitoring.selectElectricMeter"
                defaultMessage="Select Electric Meter Device"
              />
            </label>
            <select
              class="form-control"
              value={selectedDeviceId}
              onChange={this.handleDeviceChange}
              disabled={loadingDevices}
            >
              <option value="">
                <Text id="global.selectDevice" defaultMessage="Select a device" />
              </option>
              <option value="CREATE_NEW">
                <Text id="integration.energyMonitoring.createElectricMeter" defaultMessage="+ Create Electric Meter" />
              </option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
            {devicesError && (
              <div class="text-danger mt-1">
                <Text id="integration.energyMonitoring.errorLoadingDevices" defaultMessage="Error loading devices" />
              </div>
            )}
          </div>

          <div class="mb-3">
            <label class="form-label required">
              <Text id="integration.energyMonitoring.selectContract" defaultMessage="Select Energy Contract" />
            </label>
            <select
              class="form-control"
              value={selectedContractId}
              onChange={this.handleContractChange}
              disabled={loadingContracts}
            >
              <option value="">
                <Text id="integration.energyMonitoring.selectContractPlaceholder" defaultMessage="Select a contract" />
              </option>
              {contracts.map(contract => (
                <option key={contract.id} value={contract.id}>
                  {contract.name}
                </option>
              ))}
            </select>
            {contractsError && (
              <div class="text-danger mt-1">
                <Text
                  id="integration.energyMonitoring.errorLoadingContracts"
                  defaultMessage="Error loading contracts"
                />
              </div>
            )}
          </div>

          {selectedContract && (
            <div class="mb-3">
              <label class="form-label required">
                <Text
                  id="integration.energyMonitoring.selectSubscribedPower"
                  defaultMessage="Select Subscribed Power"
                />
              </label>
              <select class="form-control" value={selectedPower} onChange={this.handlePowerChange}>
                <option value="">
                  <Text id="integration.energyMonitoring.selectPowerPlaceholder" defaultMessage="Select power" />
                </option>
                {availablePowers.map(power => (
                  <option key={power} value={power}>
                    {power} kVA
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedContract && (
            <div class="mb-3">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-title">{selectedContract.name}</h5>
                  <p class="card-text">
                    <strong>
                      <Text id="integration.energyMonitoring.contractId" defaultMessage="Contract ID" />:
                    </strong>{' '}
                    {selectedContract.id}
                  </p>
                  <p class="card-text">
                    <strong>
                      <Text id="integration.energyMonitoring.availablePowers" defaultMessage="Available Powers" />:
                    </strong>{' '}
                    {selectedContract.powers.join(', ')} kVA
                  </p>
                </div>
              </div>
            </div>
          )}

          <div class="d-flex justify-content-between">
            <Link href="/dashboard/integration/device/energy-monitoring" class="btn btn-secondary">
              <Text id="global.cancel" defaultMessage="Cancel" />
            </Link>
            <button
              class={cx('btn btn-primary', { 'btn-loading': importing })}
              onClick={this.handleImport}
              disabled={!selectedDeviceId || !selectedContractId || !selectedPower || importing}
            >
              <Text id="integration.energyMonitoring.importPricesButton" defaultMessage="Import Prices" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(ImportPricesPage);
