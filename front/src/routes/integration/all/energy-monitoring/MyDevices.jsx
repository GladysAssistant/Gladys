import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import { getAttachmentFeatures } from '../../../../../../server/utils/energyHierarchy';
import { ENERGY_CONTRACT_DIRECTIONS } from '../../../../../../server/utils/constants';

// The "My devices" tab (docs/specs/energy-hierarchy.md, section E): a read-only view of the
// electric meters and of the devices they price. The links between energy features are
// maintained by Gladys; the only choice left to the user is the meter a device is on.

/**
 * @description The device at the top of the hierarchy a device hangs under.
 * @param {object} device - The device.
 * @param {Map} featureById - Every feature of the instance, by id.
 * @returns {string} The id of the root device (the device itself when it is not attached).
 * @example
 * getRootDeviceId(device, featureById);
 */
const getRootDeviceId = (device, featureById) => {
  const attached = getAttachmentFeatures(device).find(feature => feature.energy_parent_id);
  if (!attached) {
    return device.id;
  }
  let cursor = attached;
  const visited = new Set();
  while (cursor.energy_parent_id && featureById.has(cursor.energy_parent_id) && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    cursor = featureById.get(cursor.energy_parent_id);
  }
  return cursor.device_id;
};

class MyDevices extends Component {
  state = {
    contracts: [],
    contractsError: false,
    attaching: null,
    error: null
  };

  componentDidMount() {
    this.loadContracts();
  }

  loadContracts = async () => {
    try {
      const contracts = await this.props.httpClient.get('/api/v1/energy_contract');
      this.setState({ contracts: Array.isArray(contracts) ? contracts : [], contractsError: false });
    } catch (e) {
      // without the contracts, every device would look unattached: say so instead
      this.setState({ contracts: [], contractsError: true });
    }
  };

  attachDevice = async (device, meterDeviceId) => {
    try {
      this.setState({ attaching: device.id, error: null });
      await this.props.httpClient.patch(`/api/v1/device/${device.selector}/electric_meter`, {
        electric_meter_device_id: meterDeviceId
      });
      await this.props.loadDevices();
    } catch (e) {
      this.setState({ error: device.id });
    } finally {
      this.setState({ attaching: null });
    }
  };

  renderDevice = (device, meters, meterId) => {
    const isMeter = meters.some(meter => meter.id === device.id);
    return (
      <div class="list-group-item" key={device.id} data-cy="energy-device-row">
        <div class="row align-items-center">
          <div class="col-md-8 mb-2 mb-md-0">
            <div class="font-weight-bold">
              {device.name}
              {isMeter && (
                <span class="badge badge-primary ml-2" data-cy="energy-device-meter-badge">
                  <Text id="integration.energyMonitoring.hierarchy.meterBadge" />
                </span>
              )}
            </div>
            <div class="small text-muted">
              {getAttachmentFeatures(device)
                .map(feature => feature.name || feature.selector)
                .join(' · ')}
            </div>
            {this.state.error === device.id && (
              <div class="small text-danger mt-1">
                <Text id="integration.energyMonitoring.hierarchy.attachError" />
              </div>
            )}
          </div>
          {!isMeter && meters.length > 0 && (
            <div class="col-md-4">
              <label class="small text-muted mb-1">
                <Text id="integration.energyMonitoring.hierarchy.meterSelectLabel" />
              </label>
              <select
                class="form-control form-control-sm"
                data-cy="energy-device-meter-select"
                value={meterId || ''}
                disabled={this.state.attaching === device.id}
                onChange={e => this.attachDevice(device, e.target.value)}
              >
                {!meterId && (
                  <option value="" disabled>
                    {this.props.intl.dictionary.integration.energyMonitoring.hierarchy.chooseMeter}
                  </option>
                )}
                {meters.map(meter => (
                  <option key={meter.id} value={meter.id}>
                    {meter.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  render({ devices, loading, error }, { contracts, contractsError }) {
    const meterIds = new Set(
      contracts
        .filter(
          contract =>
            (contract.direction || ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION) === ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION
        )
        .map(contract => contract.electric_meter_device_id)
    );
    const meters = devices.filter(device => meterIds.has(device.id));
    const featureById = new Map();
    devices.forEach(device => (device.features || []).forEach(feature => featureById.set(feature.id, feature)));
    const devicesByMeter = new Map(meters.map(meter => [meter.id, []]));
    const unattached = [];
    devices
      .filter(device => !meterIds.has(device.id) && getAttachmentFeatures(device).length > 0)
      .forEach(device => {
        const rootDeviceId = getRootDeviceId(device, featureById);
        if (devicesByMeter.has(rootDeviceId)) {
          devicesByMeter.get(rootDeviceId).push(device);
        } else {
          unattached.push(device);
        }
      });

    return (
      <div class="card">
        <div class="card-body">
          <div class={cx('dimmer', { active: loading })}>
            <div class="loader" />
            <div class="dimmer-content">
              {error && (
                <div class="alert alert-danger" role="alert">
                  <Text id="integration.energyMonitoring.errorLoadingDevices" />
                </div>
              )}
              {contractsError && (
                <div class="alert alert-danger" role="alert" data-cy="energy-hierarchy-contracts-error">
                  <Text id="integration.energyMonitoring.contracts.errorLoading" />
                </div>
              )}
              <p class="text-muted">
                <Text id="integration.energyMonitoring.hierarchy.description" />
              </p>
              {!contractsError && meters.length === 0 && (
                <div class="alert alert-info" data-cy="energy-hierarchy-no-meter">
                  <Text id="integration.energyMonitoring.hierarchy.noMeter" />{' '}
                  <Link href="/dashboard/integration/device/energy-monitoring/contracts/create">
                    <Text id="integration.energyMonitoring.hierarchy.noMeterLink" />
                  </Link>
                </div>
              )}
              {meters.map(meter => (
                <div class="card mb-3" key={meter.id} data-cy="energy-meter-card">
                  <div class="list-group list-group-flush">
                    {this.renderDevice(meter, meters, null)}
                    {devicesByMeter.get(meter.id).map(device => this.renderDevice(device, meters, meter.id))}
                    {devicesByMeter.get(meter.id).length === 0 && (
                      <div class="list-group-item small text-muted">
                        <Text id="integration.energyMonitoring.hierarchy.noAttachedDevice" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!contractsError && unattached.length > 0 && (
                <div class="card mb-3" data-cy="energy-unattached-card">
                  <div class="card-header">
                    <h3 class="card-title">
                      <Text id="integration.energyMonitoring.hierarchy.unattachedTitle" />
                    </h3>
                  </div>
                  <div class="card-body py-2 small text-muted">
                    <Text id="integration.energyMonitoring.hierarchy.unattachedDescription" />
                  </div>
                  <div class="list-group list-group-flush">
                    {unattached.map(device => this.renderDevice(device, meters, null))}
                  </div>
                </div>
              )}
              {!contractsError && meters.length === 0 && unattached.length === 0 && !loading && (
                <div class="text-muted">
                  <Text id="integration.energyMonitoring.hierarchy.noDevice" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(MyDevices);
