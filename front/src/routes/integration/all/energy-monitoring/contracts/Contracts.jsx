import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { route } from 'preact-router';
import cx from 'classnames';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { CONTRACT_STATUS_BADGE, PROVIDER_BADGE, errorMessage } from './contractUtils';

// The Contracts tab: one contract object per meter and period (docs/specs/energy-contracts.md 8.2)
class ContractsPage extends Component {
  state = {
    contracts: [],
    loading: false,
    error: null
  };

  componentDidMount() {
    this.loadContracts();
  }

  loadContracts = async () => {
    try {
      this.setState({ loading: true, error: null });
      const contracts = await this.props.httpClient.get('/api/v1/energy_contract');
      this.setState({ contracts: Array.isArray(contracts) ? contracts : [] });
    } catch (e) {
      this.setState({ error: errorMessage(e), contracts: [] });
    } finally {
      this.setState({ loading: false });
    }
  };

  deleteContract = async contract => {
    const dictionary = this.props.intl.dictionary.integration.energyMonitoring.contracts;
    // eslint-disable-next-line no-alert
    if (!window.confirm(dictionary.confirmDelete)) {
      return;
    }
    try {
      this.setState({ loading: true, error: null });
      await this.props.httpClient.delete(`/api/v1/energy_contract/${contract.selector}`);
      await this.loadContracts();
    } catch (e) {
      this.setState({ error: errorMessage(e), loading: false });
    }
  };

  getMeterName = deviceId => {
    const device = (this.props.devices || []).find(d => d.id === deviceId);
    return device ? device.name : deviceId;
  };

  renderContract = contract => {
    const status = contract.status || 'active';
    return (
      <div class="card mb-2" key={contract.id} data-cy="energy-contract-row">
        <div class="card-body py-2 px-3">
          <div class="d-flex align-items-start justify-content-between flex-wrap">
            <div class="mr-2">
              <div class="font-weight-bold">
                {contract.name}{' '}
                <span class={cx('badge ml-1', CONTRACT_STATUS_BADGE[status])}>
                  <Text id={`integration.energyMonitoring.contracts.status.${status}`} />
                </span>
              </div>
              <div class="text-muted small">
                {contract.valid_from} →{' '}
                {contract.valid_to || <Text id="integration.energyMonitoring.contracts.ongoing" />}
                {' · '}
                {contract.currency}
                {' · '}
                <Text id={`integration.energyMonitoring.contracts.mode.${contract.pricing_mode}`} />
                {' · '}
                <span class={cx('badge', PROVIDER_BADGE[contract.provider_kind] || 'badge-secondary')}>
                  <Text id={`integration.energyMonitoring.contracts.provider.${contract.provider_kind}`} />
                  {contract.provider_service ? ` (${contract.provider_service.name})` : ''}
                </span>
                {contract.template_key ? ` · ${contract.template_key}` : ''}
              </div>
            </div>
            <div class="mt-1">
              <Link
                href={`/dashboard/integration/device/energy-monitoring/contracts/edit/${encodeURIComponent(
                  contract.selector
                )}`}
                class="btn btn-sm btn-outline-primary mr-1"
              >
                <i class="fe fe-edit-2" /> <Text id="global.edit" />
              </Link>
              <button class="btn btn-sm btn-outline-danger" onClick={() => this.deleteContract(contract)}>
                <i class="fe fe-trash" /> <Text id="global.delete" />
              </button>
            </div>
          </div>
          {status === 'orphaned' && (
            <div class="alert alert-warning mt-2 mb-0 py-2">
              <Text id="integration.energyMonitoring.contracts.orphanedHelp" />
            </div>
          )}
          {contract.migration_warning && (
            <div class="alert alert-info mt-2 mb-0 py-2">
              <Text
                id="integration.energyMonitoring.contracts.migrationWarning"
                fields={{ gap: Math.round(contract.migration_warning.gap_ratio * 1000) / 10 }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  render(props, { contracts, loading, error }) {
    const byMeter = new Map();
    contracts.forEach(contract => {
      if (!byMeter.has(contract.electric_meter_device_id)) {
        byMeter.set(contract.electric_meter_device_id, []);
      }
      byMeter.get(contract.electric_meter_device_id).push(contract);
    });
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.energyMonitoring.contracts.tab" />
          </h1>
          <div class="page-options d-flex">
            <button
              class="btn btn-outline-primary ml-2"
              data-cy="energy-contract-create"
              onClick={() => route('/dashboard/integration/device/energy-monitoring/contracts/create')}
            >
              <Text id="global.create" /> <i class="fe fe-plus" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class={cx('dimmer', { active: loading })}>
            <div class="loader" />
            <div class="dimmer-content">
              {error && (
                <div class="alert alert-danger" role="alert">
                  <Text id="integration.energyMonitoring.contracts.errorLoading" /> {error}
                </div>
              )}
              <p class="text-muted">
                <Text id="integration.energyMonitoring.contracts.description" />
              </p>
              {contracts.length === 0 && !loading && (
                <div class="text-muted" data-cy="energy-contract-empty">
                  <Text id="integration.energyMonitoring.contracts.empty" />
                </div>
              )}
              {Array.from(byMeter.entries()).map(([meterId, meterContracts]) => (
                <div class="mb-4" key={meterId}>
                  <h4 class="mb-2">
                    <i class="fe fe-zap mr-1" />
                    {this.getMeterName(meterId)}
                  </h4>
                  {meterContracts.map(this.renderContract)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(ContractsPage);
