import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../utils/consts';
import ElectricMeterSelect from '../../../../components/energy-contract/ElectricMeterSelect';
import { getElectricMeters, getMeterSelectorOfContract } from '../../../../components/energy-contract/electricMeters';

// Scene trigger fired by the core when the current unit price (or tier) of a
// meter changes, the price of the contract active on it
// (docs/specs/energy-contracts.md 8.2). The meter's device selector is stored in
// `electric_meter`; an empty value matches any meter.
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
      this.normalizeLegacyContract(contracts);
    } catch (e) {
      this.setState({
        SceneGetContracts: RequestStatus.Error
      });
    }
  };

  // A trigger saved before the meter targeting names a contract: it is read as
  // the meter of that contract, and saved as that meter from now on
  normalizeLegacyContract = contracts => {
    const { trigger, index } = this.props;
    if (trigger.electric_meter || !trigger.energy_contract) {
      return;
    }
    const meterSelector = getMeterSelectorOfContract(contracts, trigger.energy_contract);
    if (meterSelector) {
      this.props.updateTriggerProperty(index, 'electric_meter', meterSelector);
      this.props.updateTriggerProperty(index, 'energy_contract', undefined);
    }
  };

  // an empty value matches any meter
  onMeterChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'electric_meter', e.target.value);
    this.props.updateTriggerProperty(this.props.index, 'energy_contract', undefined);
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
    const { meters, mainMeter } = getElectricMeters(contracts);
    return (
      <div>
        <p>
          <Text id="editScene.triggersCard.energyPriceChanged.description" />
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.energyPriceChanged.meterLabel" />
          </div>
          <ElectricMeterSelect
            meters={meters}
            mainMeter={mainMeter}
            value={trigger.electric_meter}
            onChange={this.onMeterChange}
            emptyOption="any"
            legacyContract={trigger.energy_contract}
          />
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
