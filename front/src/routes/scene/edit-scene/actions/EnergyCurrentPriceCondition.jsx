import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Localizer, Text } from 'preact-i18n';
import get from 'get-value';

import { RequestStatus } from '../../../../utils/consts';

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

// Scene condition: the current unit price of an energy contract (spec 8.2)
// compared with a threshold in the currency of the contract, per kWh
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
      // default to the first contract, so a freshly added condition is valid
      if (isNullOrUndefined(get(this.props, 'action.energy_contract')) && contracts.length > 0) {
        this.props.updateActionProperty(this.props.path, 'energy_contract', contracts[0].selector);
      }
    } catch (e) {
      this.setState({
        SceneGetContracts: RequestStatus.Error
      });
    }
  };

  handleContractChange = e => {
    this.props.updateActionProperty(this.props.path, 'energy_contract', e.target.value);
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
    const selectedContract = contracts.find(contract => contract.selector === action.energy_contract);
    const currency = selectedContract ? selectedContract.currency : null;
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
                <Text id="editScene.actionsCard.energyCurrentPrice.contractLabel" />
              </div>
              <select class="form-control" onChange={this.handleContractChange} value={action.energy_contract || ''}>
                <option value="" disabled>
                  <Text id="global.emptySelectOption" />
                </option>
                {contracts.map(contract => (
                  <option key={contract.selector} value={contract.selector}>
                    {contract.name} ({contract.status})
                  </option>
                ))}
              </select>
              {SceneGetContracts === RequestStatus.Error && (
                <small class="text-danger">
                  <Text id="editScene.actionsCard.energyCurrentPrice.error" />
                </small>
              )}
              {SceneGetContracts === RequestStatus.Success && contracts.length === 0 && (
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
