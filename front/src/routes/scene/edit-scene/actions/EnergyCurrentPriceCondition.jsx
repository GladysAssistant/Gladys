import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Localizer, Text } from 'preact-i18n';
import get from 'get-value';

import { RequestStatus } from '../../../../utils/consts';
import ElectricMeterSelect from '../../../../components/energy-contract/ElectricMeterSelect';
import {
  getElectricMeters,
  getMeterSelectorOfContract,
  getTargetedMeter
} from '../../../../components/energy-contract/electricMeters';

const OPERATORS = ['=', '!=', '>', '>=', '<', '<='];

const OPERATOR_LABEL_KEYS = {
  '=': 'equal',
  '!=': 'different',
  '>': 'superior',
  '>=': 'superiorOrEqual',
  '<': 'inferior',
  '<=': 'inferiorOrEqual'
};

const isNullOrUndefined = variable => variable === null || variable === undefined;

// Scene condition: the current unit price of a meter (spec 8.2), the price of
// the contract active on it, compared with a threshold in the currency of the
// contract, per kWh. The meter is stored in `electric_meter`, empty for the main
// meter, so a tariff change (a new contract on the meter) needs no reconfiguration.
class EnergyCurrentPriceCondition extends Component {
  getContracts = async () => {
    this.setState({
      SceneGetContracts: RequestStatus.Getting
    });
    try {
      const contracts = await this.props.httpClient.get('/api/v1/energy_contract');
      this.setState({
        contracts,
        SceneGetContracts: RequestStatus.Success
      });
      this.normalizeLegacyContract(contracts);
    } catch (e) {
      this.setState({
        SceneGetContracts: RequestStatus.Error
      });
    }
  };

  // A condition saved before the meter targeting names a contract: it is read as
  // the meter of that contract, and saved as that meter from now on
  normalizeLegacyContract = contracts => {
    const { action, path } = this.props;
    if (action.electric_meter || !action.energy_contract) {
      return;
    }
    const meterSelector = getMeterSelectorOfContract(contracts, action.energy_contract);
    if (meterSelector) {
      this.props.updateActionProperty(path, 'electric_meter', meterSelector);
      this.props.updateActionProperty(path, 'energy_contract', undefined);
    }
  };

  // an empty value is the main meter
  handleMeterChange = e => {
    this.props.updateActionProperty(this.props.path, 'electric_meter', e.target.value);
    this.props.updateActionProperty(this.props.path, 'energy_contract', undefined);
  };

  handleOperatorChange = e => {
    this.props.updateActionProperty(this.props.path, 'operator', e.target.value);
  };

  handleValueChange = e => {
    const parsed = parseFloat(e.target.value);
    this.props.updateActionProperty(this.props.path, 'value', Number.isNaN(parsed) ? e.target.value : parsed);
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'action.operator'))) {
      this.props.updateActionProperty(this.props.path, 'operator', '<');
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      contracts: []
    };
  }

  componentDidMount() {
    this.initActionIfNeeded();
    this.getContracts();
  }

  render({ action, path }, { contracts, SceneGetContracts }) {
    const electricMeters = getElectricMeters(contracts);
    // the currency of the meter's active contract, else of its latest one
    const meter = getTargetedMeter(electricMeters, action.electric_meter);
    const contract = meter ? meter.activeContract || meter.contracts[0] : null;
    const currency = contract ? contract.currency : null;
    return (
      <div>
        {path && !path.includes('.if') && (
          <div class="row">
            <div class="col-md-12">
              <p>
                <Text id="editScene.actionsCard.energyCurrentPrice.description" />
              </p>
            </div>
          </div>
        )}
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.energyCurrentPrice.meterLabel" />
              </div>
              <ElectricMeterSelect
                meters={electricMeters.meters}
                mainMeter={electricMeters.mainMeter}
                value={action.electric_meter}
                onChange={this.handleMeterChange}
                emptyOption="main"
                legacyContract={action.energy_contract}
              />
              {SceneGetContracts === RequestStatus.Error && (
                <small class="text-danger">
                  <Text id="editScene.actionsCard.energyCurrentPrice.error" />
                </small>
              )}
              {SceneGetContracts === RequestStatus.Success && electricMeters.meters.length === 0 && (
                <small class="text-muted">
                  <Text id="editScene.actionsCard.energyCurrentPrice.noContract" />
                </small>
              )}
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.energyCurrentPrice.operatorLabel" />
              </div>
              <select class="form-control" onChange={this.handleOperatorChange} value={action.operator || '<'}>
                {OPERATORS.map(operator => (
                  <option key={operator} value={operator}>
                    <Text id={`editScene.actionsCard.energyCurrentPrice.operators.${OPERATOR_LABEL_KEYS[operator]}`} />
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.energyCurrentPrice.valueLabel" />
              </div>
              <div class="input-group">
                <Localizer>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    class="form-control"
                    value={isNullOrUndefined(action.value) ? '' : action.value}
                    onInput={this.handleValueChange}
                    placeholder={<Text id="editScene.actionsCard.energyCurrentPrice.valuePlaceholder" />}
                  />
                </Localizer>
                <div class="input-group-append">
                  <span class="input-group-text">{currency ? `${currency}/kWh` : '/kWh'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,httpClient', {})(EnergyCurrentPriceCondition);
