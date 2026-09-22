import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../utils/consts';

// Scene trigger fired by the core when the current unit price (or tier) of an
// energy contract changes (docs/specs/energy-contracts.md 8.2). The contract
// selector is stored in `energy_contract`; an empty value matches any contract.
class EnergyPriceChangedTrigger extends Component {
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
    } catch (e) {
      this.setState({
        SceneGetContracts: RequestStatus.Error
      });
    }
  };

  onContractChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'energy_contract', e.target.value);
  };

  constructor(props) {
    super(props);
    this.state = {
      contracts: []
    };
  }

  componentDidMount() {
    this.getContracts();
  }

  render({ trigger }, { contracts, SceneGetContracts }) {
    return (
      <div>
        <p>
          <Text id="editScene.triggersCard.energyPriceChanged.description" />
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.energyPriceChanged.contractLabel" />
          </div>
          <select onChange={this.onContractChange} className="form-control" value={trigger.energy_contract || ''}>
            <option value="">
              <Text id="editScene.triggersCard.energyPriceChanged.anyContract" />
            </option>
            {contracts &&
              contracts.map(contract => (
                <option key={contract.selector} value={contract.selector}>
                  {contract.name} ({contract.status})
                </option>
              ))}
          </select>
          {SceneGetContracts === RequestStatus.Error && (
            <small class="text-danger">
              <Text id="editScene.triggersCard.energyPriceChanged.error" />
            </small>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(EnergyPriceChangedTrigger);
